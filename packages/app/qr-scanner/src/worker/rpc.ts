import { decode as decodeImage, type Scan } from '@lib/qr-scanner';
import { createLogger } from '@lib/observability';

/**
 * A decoded barcode — the worker's output, mirrored into host state on
 * recognition. Derived from `@lib/qr-scanner`'s {@link Scan} so the two
 * can't drift, but picked down to its plain data fields. `Scan` itself is a
 * wasm handle (it owns `free()` and can't cross a `postMessage` boundary),
 * so it never leaves the worker; what we surface is this
 * structured-clone-safe projection.
 *
 * `details` is the parsed payload (WiFi/URL/contact/…) flattened to
 * label/value rows; `kind` says which shape it took. Both are plain data,
 * so they cross the worker boundary alongside the raw `text`.
 */
export type ScanResult = Pick<Scan, 'text' | 'format' | 'kind' | 'details'>;

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

// One canvas for the worker's lifetime, resized to each frame's dimensions.
// Built up front rather than lazily on the first frame so the context is a
// guaranteed value — no per-frame null check threaded through the decode hot
// path. A worker that can't get a 2D context can't decode at all, so we fail
// loud at load instead of folding every frame to a miss. `willReadFrequently`
// keeps the backing store in CPU memory — we read every pixel back each
// frame, so GPU upload churn is pure overhead.
const canvas = new OffscreenCanvas(1, 1);
const context = canvas.getContext('2d', { willReadFrequently: true });
if (!context) {
  throw new Error('Decoder worker could not acquire a 2D canvas context.');
}

const decodeFrame = (bitmap: ImageBitmap): ScanResult | null => {
  const { width, height } = bitmap;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

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
 * {@link ScanResult} on a hit, `null` on a miss.
 *
 * No init guard: the host awaits the `ready` event before sending any frame,
 * so the module is live by the time one lands, and a frame that somehow beat
 * init would trap on its first wasm call anyway — `decode` throws straight
 * away when the module isn't instantiated. Any trap — that, a blocked canvas
 * read, a wasm panic — is caught, logged, and folded to `null` so the capture
 * loop just tries the next frame instead of wedging on a missing reply.
 *
 * The bitmap transfers in, so it's ours to release — closed on every path,
 * verdict or throw, so its backing memory isn't pinned.
 */
const decode = ({ bitmap }: { bitmap: ImageBitmap }): ScanResult | null => {
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

/**
 * The worker's RPC implementation — the single source of truth for both the
 * `decode` handler and the {@link DecoderApi} contract derived from it. The
 * worker entry wires this onto its RPC; the host calls it.
 *
 * Handlers stay params-only — they don't take the RPC options bag — so the
 * type derived from this value reads as a clean procedure contract rather
 * than leaking handler-side parameters into the API.
 */
export const api = {
  requests: { decode },
};

/**
 * The decoder worker's RPC surface — a single `decode` request returning a
 * {@link ScanResult} or `null` — derived straight from the {@link api}
 * implementation so the contract can't drift from the handler that fulfills
 * it.
 */
export type DecoderApi = typeof api;
