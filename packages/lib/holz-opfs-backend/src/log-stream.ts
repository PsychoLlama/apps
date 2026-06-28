import type { RPC } from '@lib/messaging/rpc';
import type { SendOptions } from '@lib/messaging/message-port';
import type { HostApi } from './host-api';
import type { WorkerApi } from './worker/rpc';

/**
 * Drain a buffer of whole NDJSON lines into the worker, one line per `log`
 * event. The reader applies backpressure from the buffer — events go out only
 * as fast as lines are produced — and the loop ends when the buffer closes.
 * Fire-and-forget per the {@link RPC.notify} contract; ordering holds because
 * the transport delivers in send order.
 *
 * Used wherever a JSON-backend buffer feeds the worker boundary: the main
 * thread streaming a tab's logs, and the SharedWorker hub streaming its own
 * (see `./main/index.ts` and `./worker/hub.ts`).
 *
 * Each chunk's buffer is transferred, not copied — a zero-copy hand-off on this
 * hot path. Safe because the chunk owns its buffer outright: the JSON backend
 * mints it via `TextEncoder.encode` (a fresh, exact-sized `ArrayBuffer`) and
 * the buffer is a pass-through `TransformStream`, so nothing else references it
 * once we've read it. Transferring neuters our copy, which we never touch again.
 */
export const streamLogs = async (
  readable: ReadableStream<Uint8Array>,
  rpc: RPC<HostApi, WorkerApi, SendOptions>,
): Promise<void> => {
  const reader = readable.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    rpc.notify('log', value, { transfer: [value.buffer] });
  }
};
