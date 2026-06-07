import type { DeepReadonly } from '@lib/state';
import DecoderWorker from './decoder.worker?worker';
import type { ScannerState, ScanResult } from './store';

/** Worker → main handshake: the wasm module is initialized and ready. */
export interface ReadyMessage {
  type: 'ready';
}

/**
 * Main → worker: decode this frame. The bitmap is transferred (zero-copy)
 * and consumed (closed) by the worker, so the sender must not touch it
 * after posting.
 */
export interface DecodeRequest {
  bitmap: ImageBitmap;
}

/**
 * Spawn the decoder worker and resolve once its wasm module is live. The
 * worker eagerly initializes on load and posts a one-shot `ready`; we
 * await that so a caller never hands it a frame before it can decode.
 */
export const createDecoder = (): Promise<Worker> =>
  new Promise((resolve) => {
    const worker = new DecoderWorker();
    // The worker's first message is always its `ready` handshake — it
    // posts nothing else until handed a frame, which can't happen before
    // this resolves. So a one-shot listener needs no type guard or manual
    // teardown: `{ once: true }` removes it after that single message.
    worker.addEventListener('message', () => resolve(worker), { once: true });
  });

/** Terminate the decoder worker, if one is live. A no-op otherwise. */
export const terminateDecoder = (state: DeepReadonly<ScannerState>): void => {
  state.decoder?.current.terminate();
};

/**
 * Send a frame to the worker and await its verdict — a {@link ScanResult}
 * on a hit, `null` on a miss. The bitmap transfers across, so it's gone
 * from this thread once posted. Awaiting a single bare reply is safe
 * because the capture loop keeps just one frame in flight at a time.
 */
export const requestDecode = (
  worker: Worker,
  bitmap: ImageBitmap,
): Promise<ScanResult | null> =>
  new Promise((resolve) => {
    // One reply per request, and back-pressure keeps just one frame in
    // flight — so a one-shot listener can't pick up a stale or crossed
    // reply, and frees us from manual `removeEventListener`.
    worker.addEventListener(
      'message',
      ({ data }: MessageEvent<ScanResult | null>) => resolve(data),
      { once: true },
    );
    worker.postMessage({ bitmap } satisfies DecodeRequest, [bitmap]);
  });
