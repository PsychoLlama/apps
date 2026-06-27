import type { LogProcessor } from '@holz/core';
import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import ObservabilityWorker from '#worker?worker';
import type { HostApi } from '../host-api';
import type { LogLocation, WorkerApi } from '../worker/rpc';
import { OBSERVABILITY_WORKER_NAME } from '../environment';
import { createNdjsonBuffer } from '../ndjson-buffer';
import { announceLogFile } from './log-file-feed';

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
 * Drain the host's NDJSON buffer into the worker, one whole line per `log`
 * event. The reader applies backpressure from the buffer — events go out only
 * as fast as lines are produced — and the loop ends when the buffer closes.
 * Fire-and-forget per the {@link RPC.notify} contract; ordering holds because
 * the transport delivers in send order.
 *
 * Each chunk's buffer is transferred, not copied — a zero-copy hand-off on this
 * hot path. Safe because the chunk owns its buffer outright: the JSON backend
 * mints it via `TextEncoder.encode` (a fresh, exact-sized `ArrayBuffer`) and
 * the buffer is a pass-through `TransformStream`, so nothing else references it
 * once we've read it. Transferring neuters our copy, which we never touch again.
 */
const streamLogs = async (
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

/**
 * A log backend that will ship logs to the observability worker for
 * off-main-thread persistence to OPFS. Spawns the worker eagerly — the moment
 * the backend is created — so it's warm before the first log arrives.
 *
 * The caller owns the {@link LogLocation}: this package persists wherever it's
 * told, never assuming a directory or file name of its own. The host (see
 * `@lib/observability`) mints a session-unique name and passes it in.
 *
 * Must be created on the browser main thread: only it can construct a
 * `Worker`, and spawning from inside a worker would loop. The pipeline links
 * this in behind `inMainThread` (see `@lib/observability`'s browser
 * processor), which is the sole guard — calling it off the main thread is a
 * wiring bug, not a runtime input to defend against.
 */
export const createOpfsWorkerBackend = (
  location: LogLocation,
): LogProcessor => {
  // `name` is load-bearing, not just a DevTools label: the worker reads it as
  // `self.name` to recognize itself as the observability worker and persist its
  // own logs (see `../environment.ts`).
  const worker = new ObservabilityWorker({ name: OBSERVABILITY_WORKER_NAME });

  // Host-local buffer the JSON backend writes UTF-8 NDJSON into, deep enough to
  // absorb startup bursts and queue everything logged during worker boot until
  // the `init` reply lets streaming begin (see `createNdjsonBuffer`).
  const { backend, readable } = createNdjsonBuffer();

  // Wire the host end of the worker RPC. The host serves nothing — it drives
  // the boundary by calling the worker's `init` request below.
  const rpc = RPC.from<HostApi, WorkerApi, SendOptions>(
    new MessagePortTransport<RpcMessage, RpcMessage>(worker),
    {},
  );

  // Tell the worker where to persist this session's logs and wait for it to
  // open the file. The request rides over to the worker as soon as its script
  // loads (a later task), so it can't outrun the worker's listener.
  void rpc.request('init', location).then(() => {
    // The file now exists on disk (the worker created it to satisfy `init`).
    // Announce it so any open log viewer — in another tab, or this one, where
    // the file landed too late for the initial enumeration — adds its row
    // without waiting to re-read the directory.
    announceLogFile(location.file);

    // Stream the session's NDJSON to the worker as `log` events — the buffered
    // boot logs first, then live ones — sequenced after `init` so every line
    // lands in the now-open file.
    void streamLogs(readable, rpc);
  });

  // The worker batches OPFS flushes by size and time for throughput, so an
  // unflushed tail always trails the latest writes. A backgrounded page can be
  // frozen or killed before that tail lands — `visibilitychange → hidden` is
  // the last beat we can rely on (notably on mobile, where it supersedes the
  // unreliable `unload`). Nudge the worker to flush it now. Fire-and-forget:
  // the page may not outlive a round trip, and the event no-ops before `init`.
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
