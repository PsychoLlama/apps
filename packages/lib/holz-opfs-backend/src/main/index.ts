import type { LogProcessor } from '@holz/core';
import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import ObservabilityWorker from '#worker?sharedworker';
import type { HostApi } from '../host-api';
import type { WorkerApi } from '../worker/rpc';
import { OBSERVABILITY_WORKER_NAME } from '../environment';
import { createNdjsonBuffer } from '../ndjson-buffer';
import { streamLogs } from '../log-stream';

/**
 * The slice of `document` this backend reads for page-lifecycle flushing. Named
 * structurally rather than as `Document` so it resolves under the `WebWorker`
 * lib too — consumers typecheck this module without the DOM lib (see below).
 */
interface PageVisibility {
  visibilityState: string;
  addEventListener: (type: 'visibilitychange', listener: () => void) => void;
}

/**
 * A log backend that ships this tab's logs to the shared observability worker
 * for off-main-thread persistence to OPFS. Connects to the worker eagerly — the
 * moment the backend is created — so it's warm before the first log arrives.
 *
 * The worker is a {@link SharedWorker}: a single instance, shared by every tab
 * on the origin, that funnels all tabs' logs into one OPFS file. This tab is
 * just one connection. From here it's a black box — it opens and owns the file
 * itself (via a nested writer worker; see `../worker/hub.ts`), so there's no
 * handshake. Streaming starts immediately; a line that beats the open queues in
 * the writer's sink and lands once the file is open.
 *
 * Must be created on the browser main thread: only it should drive the page
 * lifecycle below, and the pipeline links this in behind `inMainThread` (see
 * `@lib/observability`'s browser processor), which is the sole guard — calling
 * it off the main thread is a wiring bug, not a runtime input to defend
 * against. The processor also gates on `SharedWorker` being available, so this
 * never runs where the constructor is missing.
 */
export const createOpfsWorkerBackend = (): LogProcessor => {
  // `name` is load-bearing, not just a DevTools label: it's the SharedWorker's
  // identity, so every tab passing the same name shares one instance, and the
  // worker reads it as `self.name` to recognize itself as the observability
  // worker and persist its own logs (see `../environment.ts`).
  const worker = new ObservabilityWorker({ name: OBSERVABILITY_WORKER_NAME });

  // A `SharedWorker` talks over a `MessagePort`, which delivers nothing until
  // started (the transport listens via `addEventListener`). Start it before
  // wiring the RPC so no early reply is dropped.
  worker.port.start();

  // Host-local buffer the JSON backend writes UTF-8 NDJSON into, deep enough to
  // absorb startup bursts and queue everything logged during worker boot until
  // streaming begins (see `createNdjsonBuffer`).
  const { backend, readable } = createNdjsonBuffer();

  // Wire this tab's end of the worker RPC. The host serves nothing — it only
  // streams `log` events and nudges `flush`.
  const rpc = RPC.from<HostApi, WorkerApi, SendOptions>(
    new MessagePortTransport<RpcMessage, RpcMessage>(worker.port),
    {},
  );

  // Stream this tab's NDJSON to the worker as `log` events — the buffered boot
  // logs first, then live ones. No `init` to wait on: the worker opens its file
  // eagerly, and any line that arrives first queues in its sink and drains in
  // order once the file is open.
  void streamLogs(readable, rpc);

  // The worker batches OPFS flushes by size and time for throughput, so an
  // unflushed tail always trails the latest writes. A backgrounded page can be
  // frozen or killed before that tail lands — `visibilitychange → hidden` is
  // the last beat we can rely on (notably on mobile, where it supersedes the
  // unreliable `unload`). Nudge the worker to flush it now. Fire-and-forget:
  // the page may not outlive a round trip.
  //
  // `document` is main-thread-only; consumers (e.g. `@app/service-worker`)
  // typecheck this module under the `WebWorker` lib, where the global is absent.
  // Reach it through a structural cast — `inMainThread` already gates this
  // backend (see `@lib/observability`'s browser processor), so the global is
  // present at run.
  const page = (globalThis as { document?: PageVisibility }).document;
  if (page) {
    page.addEventListener('visibilitychange', () => {
      if (page.visibilityState === 'hidden') rpc.notify('flush');
    });
  }

  // The closure keeps `worker` (via the RPC transport) reachable.
  return backend;
};
