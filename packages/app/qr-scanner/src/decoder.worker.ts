import init, { decode } from '@lib/qr-scanner';
import { createLogger } from '@lib/observability';
import { RPC, respond, type RpcMessage } from '@lib/messaging';
import {
  MessagePortTransport,
  type MessageEndpoint,
  type SendOptions,
} from '@lib/messaging/transport';
import type { DecoderApi, HostApi } from './decoder';
import type { ScanResult } from './store';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Eagerly initialize the wasm module on worker load — not lazily on the
 * first frame — so it's warm by the time the camera goes live. Every
 * `decode` awaits this, so an early frame queues behind init rather than
 * racing it.
 */
const ready: Promise<void> = init().then(() => {
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
  const scan = decode(data, width, height);
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

// `MessagePortTransport` drives any `MessageEndpoint`, and the worker global
// scope is one at runtime: `postMessage(message, transfer)` plus
// `add/removeEventListener`. The cast is only to satisfy the type checker —
// this package is typed for the DOM, so `self` reads as a `Window`, whose
// `postMessage(message, targetOrigin, …)` overload doesn't match. Removing it
// needs a worker-typed lib for `*.worker.ts` (tracked as a followup).
const transport = new MessagePortTransport<RpcMessage, RpcMessage>(
  self as MessageEndpoint,
);

const rpc = new RPC<DecoderApi, HostApi, SendOptions>(transport, {
  requests: {
    decode: async ({ bitmap }) => {
      await ready;
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
        // The bitmap transferred in, so it's ours to release — close it
        // regardless of verdict so its backing memory isn't pinned.
        bitmap.close();
      }
      return respond(result);
    },
  },
});

// Announce readiness so the main thread can start handing us frames. It
// awaits this `ready` event before sending the first `decode`.
void ready.then(() => rpc.notify('ready'));
