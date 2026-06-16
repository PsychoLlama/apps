import type { LogProcessor } from '@holz/core';
import { createJsonBackend } from '@holz/json-backend';
import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import ObservabilityWorker from '../../worker/index?worker';
import { createHostHandlers, type HostApi } from '../../host-api.ts';
import type { WorkerApi } from '../../worker/rpc.ts';

/**
 * A log backend that will ship logs to the observability worker for
 * off-main-thread persistence to OPFS. Spawns the worker eagerly — the moment
 * the backend is created — so it's warm before the first log arrives.
 *
 * Must be created on the browser main thread: only it can construct a
 * `Worker`, and spawning from inside a worker would loop. The pipeline links
 * this in behind `inMainThread` (see `../processor.browser.ts`), which is the
 * sole guard — calling it off the main thread is a wiring bug, not a runtime
 * input to defend against.
 */
export const createOpfsWorkerBackend = (): LogProcessor => {
  // `name` surfaces in DevTools' thread list and is readable inside the
  // worker as `self.name` — a stable label beats the anonymous default.
  const worker = new ObservabilityWorker({ name: 'Observability' });

  // Host-local buffer the JSON backend writes UTF-8 NDJSON into. It exists for
  // two reasons, both rooted in the transferred stream being a cross-realm
  // writable with a high-water mark fixed at 1 by spec
  // (`SetUpCrossRealmTransformWritable`): writing to it directly drops
  // `desiredSize` to 0 until the worker acks across the thread boundary, and
  // the JSON backend skips any log written while `desiredSize <= 0`, so a burst
  // (e.g. the startup flurry) loses all but its first log — verified
  // empirically. This buffer's deep headroom absorbs those bursts, and because
  // nothing reads its readable end until `ready` connects the pipe, it also
  // queues everything logged during worker boot instead of dropping it. The
  // backend writes here from the very first log; `pipeTo` later applies
  // backpressure by queuing, never dropping.
  const buffer = new TransformStream<Uint8Array, Uint8Array>(
    undefined,
    new CountQueuingStrategy({ highWaterMark: 1024 }),
  );

  // Wire the host end of the worker RPC. `RPC.from` subscribes eagerly, so
  // doing it synchronously right after spawning attaches the listener before
  // the worker can post: the worker fires `ready` on boot, but that can't run
  // until its script loads (a later task), so the event can't be missed. The
  // endpoint is intentionally not retained — the transport's listener keeps it
  // reachable via `worker`, and the backend has no teardown.
  RPC.from<HostApi, WorkerApi, SendOptions>(
    new MessagePortTransport<RpcMessage, RpcMessage>(worker),
    createHostHandlers((stream) => {
      // The worker handed us the writable end of its log stream. Drain the
      // buffered NDJSON into it — anything logged before now flushes, and later
      // logs flow straight through (the worker reads the chunks off the other
      // end; for now it just logs their size — OPFS persistence lands later).
      void buffer.readable.pipeTo(stream);
    }),
  );

  // The closure keeps `worker` (via the RPC transport) reachable.
  return createJsonBackend({ stream: buffer.writable });
};
