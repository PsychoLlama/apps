import init, { decode as decodeImage } from '@lib/qr-scanner';
import { createLogger } from '@lib/observability';
import type { ScanResult } from '../store';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Eagerly initialize the wasm module on worker load — not lazily on the
 * first frame — so it's warm by the time the camera goes live. Resolves
 * once the module is live; the worker awaits it to announce `ready` to the
 * host, which holds its first frame until that event lands.
 */
let initialized = false;
export const ready: Promise<void> = init().then(() => {
  initialized = true;
  logger.debug('Decoder wasm initialized.');
});

// One canvas for the worker's lifetime, resized lazily to each frame's
// dimensions. `willReadFrequently` keeps the backing store in CPU
// memory — we read every pixel back each frame, so GPU upload churn is
// pure overhead.
let canvas: OffscreenCanvas | undefined;
let context: OffscreenCanvasRenderingContext2D | null = null;

const decodeFrame = (bitmap: ImageBitmap): ScanResult | null => {
  const { width, height } = bitmap;

  if (!canvas) {
    canvas = new OffscreenCanvas(width, height);
    context = canvas.getContext('2d', { willReadFrequently: true });
  }
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  if (!context) return null;

  // Decode the whole frame at its native resolution — no downscale, no
  // crop. The reticle is a UI gate, not a scan region, so we hand rxing
  // everything in view at full detail.
  context.drawImage(bitmap, 0, 0);
  const { data } = context.getImageData(0, 0, width, height);
  const scan = decodeImage(data, width, height);
  // Project the wasm handle to its plain fields before it crosses back to
  // the main thread — `Scan` owns `free()` and can't be structured-cloned.
  // `details` is already plain `Detail` objects from the wasm.
  return scan
    ? {
        text: scan.text,
        format: scan.format,
        kind: scan.kind,
        details: scan.details,
      }
    : null;
};

/**
 * Decode a single frame — the worker's one request handler. Resolves with a
 * {@link ScanResult} on a hit, `null` on a miss, and rejects only when the
 * contract is broken.
 *
 * Asserts the wasm module is live first. The host awaits the `ready` event
 * before sending any frame, so a frame arriving pre-init is an ordering bug,
 * not a race to wait out — reject it (rather than queue behind init and mask
 * the violation) so it surfaces. A frame that traps the live decoder
 * (blocked canvas read, wasm panic) is different: it resolves `null` so the
 * capture loop just tries the next one instead of wedging on a missing reply.
 *
 * The bitmap transfers in, so it's ours to release — closed on every path,
 * verdict or throw, so its backing memory isn't pinned.
 */
export const decode = ({
  bitmap,
}: {
  bitmap: ImageBitmap;
}): ScanResult | null => {
  if (!initialized) {
    bitmap.close();
    throw new Error('Decoder received a frame before wasm initialization.');
  }

  try {
    return decodeFrame(bitmap);
  } catch (error) {
    logger.error('Failed to decode a frame.', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return null;
  } finally {
    bitmap.close();
  }
};
