import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import { createLogger } from '@lib/observability';
import DecoderWorker from './worker/index?worker';
import type { DecoderApi, ScanResult } from './worker/rpc';
import { createHostHandlers, type HostApi } from './host-api';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * The main thread's end of the decoder RPC. `SendOptions` lets a frame ride
 * across by transfer (zero-copy) rather than by structured clone.
 */
export type DecoderRpc = RPC<HostApi, DecoderApi, SendOptions>;

/**
 * A live decoder: the worker plus the {@link DecoderRpc} bound to it. Held
 * together because teardown needs both — `rpc.close()` rejects in-flight
 * requests, then `worker.terminate()` reclaims the thread. Stashed in a cell
 * so the reactive layer doesn't proxy the host objects.
 */
export interface DecoderConnection {
  worker: Worker;
  rpc: DecoderRpc;
}

/**
 * Spawn the decoder worker and resolve once its wasm module is live. The
 * worker eagerly initializes on load and fires a one-shot `ready` event; we
 * await that so a caller never hands it a frame before it can decode.
 *
 * Cancellation is cooperative: a spawn already under way can't be recalled,
 * so a worker that becomes ready after the abort is terminated here rather
 * than leaked into a page that's already gone.
 */
export const createDecoder = async (
  signal: AbortSignal,
): Promise<DecoderConnection> => {
  const worker = new DecoderWorker({ name: 'QR Decoder' });

  // Resolve once the worker's `ready` event lands. The handler stays
  // registered on the RPC afterwards, but a repeat `ready` only re-resolves
  // an already-settled promise — a harmless no-op.
  let markReady!: () => void;
  const ready = new Promise<void>((resolve) => {
    markReady = resolve;
  });

  const rpc: DecoderRpc = RPC.from<HostApi, DecoderApi, SendOptions>(
    new MessagePortTransport<RpcMessage, RpcMessage>(worker),
    createHostHandlers(markReady),
  );

  await ready;

  if (signal.aborted) {
    terminateDecoder({ worker, rpc });
    logger.debug('Decoder preload superseded before ready; terminated it.');
  }
  signal.throwIfAborted();

  return { worker, rpc };
};

/**
 * Tear down a decoder connection: close the RPC first so any frame still in
 * flight rejects (and the capture loop drops it), then reclaim the thread. A
 * no-op when nothing was ever attached, so it doubles as the cell's `drop`.
 */
export const terminateDecoder = (
  connection: DecoderConnection | null,
): void => {
  if (!connection) return;
  connection.rpc.close();
  connection.worker.terminate();
};

/**
 * Send a frame to the worker and await its verdict — a {@link ScanResult}
 * on a hit, `null` on a miss. The bitmap transfers across, so it's gone
 * from this thread once posted.
 *
 * The RPC correlates each request to its own response by id, so replies
 * can't cross even when the worker is shared across camera sessions and
 * several frames are in flight at once — no per-request ports, no manual
 * bookkeeping.
 */
export const requestDecode = (
  connection: DecoderConnection,
  bitmap: ImageBitmap,
): Promise<ScanResult | null> =>
  connection.rpc.request('decode', { bitmap }, { transfer: [bitmap] });
