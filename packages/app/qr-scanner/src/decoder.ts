import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import type { DeepReadonly } from '@lib/state';
import DecoderWorker from './worker/index?worker';
import type { DecoderApi, ScanResult } from './worker/rpc';
import type { DecoderState } from './decoder-store';
import { createHostHandlers, type HostApi } from './host-api';

/**
 * The main thread's end of the decoder RPC. `SendOptions` lets a frame ride
 * across by transfer (zero-copy) rather than by structured clone.
 */
export type DecoderRpc = RPC<HostApi, DecoderApi, SendOptions>;

/**
 * A live decoder: the worker plus the {@link DecoderRpc} bound to it. Held
 * together because teardown needs both — `rpc.close()` rejects in-flight
 * requests, then `worker.terminate()` reclaims the thread. Stashed behind a
 * `Ref` in the store so the reactive layer doesn't proxy the host objects.
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
 * Guarded against teardown mid-preload: we snapshot
 * {@link DecoderState.generation} before spawning and re-check it once the
 * worker is ready. If it changed, the scanner unmounted (or restarted)
 * while we were initializing — so we tear the now-orphaned connection down
 * and resolve `null` rather than leak a live worker into a dead page.
 * Otherwise the connection is handed back to be attached.
 */
export const createDecoder = async (
  state: DeepReadonly<DecoderState>,
): Promise<DecoderConnection | null> => {
  const generation = state.generation;
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

  if (state.generation !== generation) {
    rpc.close();
    worker.terminate();
    return null;
  }

  return { worker, rpc };
};

/** Tear down the decoder connection, if one is live. A no-op otherwise. */
export const terminateDecoder = (state: DeepReadonly<DecoderState>): void => {
  const connection = state.connection?.current;
  if (!connection) return;
  // Close the RPC first so any frame still in flight rejects (and the
  // capture loop drops it) before the thread is reclaimed.
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
