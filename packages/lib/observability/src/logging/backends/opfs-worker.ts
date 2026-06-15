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
/** A sink that discards every log. The backend starts here, before `ready`. */
const drop: LogProcessor = () => {};

export const createOpfsWorkerBackend = (): LogProcessor => {
  // `name` surfaces in DevTools' thread list and is readable inside the
  // worker as `self.name` — a stable label beats the anonymous default.
  const worker = new ObservabilityWorker({ name: 'Observability' });

  // The live sink. Drops logs until the worker fires `ready` with the writable
  // end of its log stream, at which point the JSON backend takes over.
  // TODO: anything logged before `ready` is lost. Buffer it and flush once the
  // JSON backend is attached.
  let sink: LogProcessor = drop;

  // Wire the host end of the worker RPC. `RPC.from` subscribes eagerly, so
  // doing it synchronously right after spawning attaches the listener before
  // the worker can post: the worker fires `ready` on boot, but that can't run
  // until its script loads (a later task), so the event can't be missed. The
  // endpoint is intentionally not retained — the transport's listener keeps it
  // reachable via `worker`, and the backend has no teardown.
  RPC.from<HostApi, WorkerApi, SendOptions>(
    new MessagePortTransport<RpcMessage, RpcMessage>(worker),
    createHostHandlers((stream) => {
      // The worker handed us the writable end of its log stream — write UTF-8
      // NDJSON into it (the worker reads the chunks off the other end; for now
      // it just logs their size — OPFS persistence lands later).
      //
      // The transferred stream is a cross-realm writable with a high-water mark
      // fixed at 1: each write drops its `desiredSize` to 0 until the worker
      // acks across the thread boundary, and the JSON backend skips any log
      // written while `desiredSize <= 0`. Writing straight to it would lose all
      // but the first log of a burst (e.g. the flurry at startup). So interpose
      // a host-local buffer with deep headroom for the backend to write into,
      // and pipe it to the worker — `pipeTo` applies backpressure by queuing,
      // never dropping.
      const buffer = new TransformStream<Uint8Array, Uint8Array>(
        undefined,
        new CountQueuingStrategy({ highWaterMark: 1024 }),
      );
      void buffer.readable.pipeTo(stream);
      sink = createJsonBackend({ stream: buffer.writable });
    }),
  );

  // Delegate to whichever sink is live — `drop` until `ready`, then the JSON
  // backend. The closure also keeps `worker` (via the RPC transport) reachable.
  return (log) => sink(log);
};
