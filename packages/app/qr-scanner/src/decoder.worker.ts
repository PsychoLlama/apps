import init, { decode, rgba_to_luma } from '@lib/qr-scanner';
import { createLogger } from '@lib/observability';
import { fitDimensions } from './frame-fit';
import type { DecodeRequest, ReadyMessage } from './decoder';
import type { ScanResult } from './store';

// The package is typed for the DOM, so the global `self` reads as a
// `Window`. That's fine for our touchpoints — `self.postMessage` (the
// one-shot `ready` handshake), `onmessage`, and the per-request reply
// `port` — which share the worker's shape.

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Eagerly initialize the wasm module on worker load — not lazily on the
 * first frame — so it's warm by the time the camera goes live, then
 * announce readiness. Every frame awaits this, so an early frame queues
 * behind init rather than racing it.
 */
const ready: Promise<void> = init().then(() => {
  logger.debug('Decoder wasm initialized.');
  self.postMessage({ type: 'ready' } satisfies ReadyMessage);
});

// One canvas for the worker's lifetime, resized lazily to each frame's
// fitted dimensions. `willReadFrequently` keeps the backing store in CPU
// memory — we read every pixel back each frame, so GPU upload churn is
// pure overhead.
let canvas: OffscreenCanvas | undefined;
let context: OffscreenCanvasRenderingContext2D | null = null;

const decodeFrame = (bitmap: ImageBitmap): ScanResult | null => {
  const { width, height } = fitDimensions(bitmap.width, bitmap.height);

  if (!canvas) {
    canvas = new OffscreenCanvas(width, height);
    context = canvas.getContext('2d', { willReadFrequently: true });
  }
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  if (!context) return null;

  // Downscale the whole frame into the canvas — no source crop. The
  // reticle is a UI gate, not a scan region, so we decode everything in
  // view and leave any match-location mapping a single uniform scale.
  context.drawImage(bitmap, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);
  const scan = decode(rgba_to_luma(data), width, height);
  return scan ? { text: scan.text, format: scan.format } : null;
};

self.onmessage = ({ data }: MessageEvent<DecodeRequest>) => {
  void ready.then(() => {
    const { bitmap, port } = data;
    let result: ScanResult | null = null;
    try {
      result = decodeFrame(bitmap);
    } catch (error) {
      // A frame that traps the decoder (blocked canvas read, wasm panic)
      // must not strand the request: the main thread awaits exactly one
      // reply per frame, so a missing reply would wedge the capture loop
      // with its in-flight slot held forever. Log it and reply `null` —
      // the next frame tries again.
      logger.error('Failed to decode a frame.', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
    } finally {
      bitmap.close();
    }
    // Reply on this request's private port, then close our end — the
    // verdict reaches only the frame that asked for it.
    port.postMessage(result);
    port.close();
  });
};
