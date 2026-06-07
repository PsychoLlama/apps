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
    const onReady = ({ data }: MessageEvent<ReadyMessage>) => {
      if (data?.type !== 'ready') return;
      worker.removeEventListener('message', onReady);
      resolve(worker);
    };
    worker.addEventListener('message', onReady);
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
    const onMessage = ({ data }: MessageEvent<ScanResult | null>) => {
      worker.removeEventListener('message', onMessage);
      resolve(data);
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage({ bitmap } satisfies DecodeRequest, [bitmap]);
  });
