import type { LogProcessor } from '@holz/core';
import { createJsonBackend } from '@holz/json-backend';
import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import ObservabilityWorker from '../../worker/index?worker';
import type { HostApi } from '../../host-api.ts';
import type { LogLocation, WorkerApi } from '../../worker/rpc.ts';
import { LOG_DIRECTORY, LOG_FILE_NAME } from '../log-file.ts';

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
  // nothing reads its readable end until the worker's `init` reply connects the
  // pipe, it also queues everything logged during worker boot. The
  // backend writes here from the very first log; `pipeTo` later applies
  // backpressure by queuing, never dropping.
  const buffer = new TransformStream<Uint8Array, Uint8Array>(
    undefined,
    new CountQueuingStrategy({ highWaterMark: 1024 }),
  );

  // Wire the host end of the worker RPC. The host serves nothing — it drives
  // the boundary by calling the worker's `init` request below.
  const rpc = RPC.from<HostApi, WorkerApi, SendOptions>(
    new MessagePortTransport<RpcMessage, RpcMessage>(worker),
    {},
  );

  // Tell the worker where to persist this session's logs and await the writable
  // end it opens there. The request rides over to the worker as soon as its
  // script loads (a later task), so it can't outrun the worker's listener.
  const location: LogLocation = {
    directory: LOG_DIRECTORY,
    file: LOG_FILE_NAME,
  };

  void rpc.request('init', location).then((stream) => {
    // The worker handed back the writable end of its OPFS-backed log stream.
    // Drain the buffered NDJSON into it — anything logged during boot flushes,
    // and later logs flow straight through.
    void buffer.readable.pipeTo(stream);
  });

  // The worker batches OPFS flushes by size and time for throughput, so an
  // unflushed tail always trails the latest writes. A backgrounded page can be
  // frozen or killed before that tail lands — `visibilitychange → hidden` is
  // the last beat we can rely on (notably on mobile, where it supersedes the
  // unreliable `unload`). Nudge the worker to flush it now. Fire-and-forget:
  // the page may not outlive a round trip, and the event no-ops before `init`.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') rpc.notify('flush');
  });

  // The closure keeps `worker` (via the RPC transport) reachable.
  return createJsonBackend({ stream: buffer.writable });
};
