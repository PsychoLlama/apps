import { defineContract } from '@lib/messaging/rpc';
import type { SendOptions } from '@lib/messaging/message-port';

/**
 * Where the worker should persist a session's logs: a `file` inside a
 * `directory`, both relative to the origin-private file system root. The host
 * owns both values — it derives a unique file name and picks the directory —
 * and hands them over in the `init` request (see {@link createWorkerHandlers}).
 */
export interface LogLocation {
  directory: string;
  file: string;
}

/**
 * One session's OPFS-backed log sink: the writable end transferred to the host
 * (its UTF-8 NDJSON chunks land in the log file) paired with a `flush` that
 * forces the unflushed tail to disk on demand. `openLogStream` yields both so
 * the worker can hand the stream over while keeping a flush handle for the
 * host's `flush` event.
 */
export interface LogSink {
  stream: WritableStream<Uint8Array>;
  flush: () => void;
}

/**
 * Build the worker's RPC handlers — the observability worker's end of the
 * boundary (see `../logging/backends/opfs-worker.ts`). The host calls `init`
 * once with where to write; the worker opens that file and replies with the
 * writable end of a stream whose UTF-8 NDJSON chunks it persists there. The
 * host later fires `flush` to force the pending batch to disk early.
 *
 * `openLogStream` is injected rather than wired here so this module stays a
 * pure RPC contract, free of the OPFS runtime it would otherwise drag in — the
 * host imports {@link WorkerApi} from here to type its `request('init', …)`,
 * and a type-only import shouldn't reach into `navigator.storage`.
 *
 * {@link WorkerApi} is derived from what this returns (via {@link
 * defineContract}), so the contract tracks the implementation — the worker-side
 * mirror of how the host derives its {@link HostApi} from the value it serves.
 */
export const createWorkerHandlers = (
  openLogStream: (location: LogLocation) => Promise<LogSink>,
) => {
  // The active session's flush handle, refreshed on each `init`. The `flush`
  // event reaches through it; `undefined` until the first `init` opens a sink.
  let flushActive: (() => void) | undefined;

  return defineContract<SendOptions>()({
    requests: {
      // Open the log file and transfer the writable end back with the reply, so
      // the host pipes straight into the worker's OPFS-backed sink.
      init: async (location: LogLocation, options) => {
        const sink = await openLogStream(location);
        flushActive = sink.flush;
        options.transfer = [sink.stream];
        return sink.stream;
      },
    },
    events: {
      // The host's page went hidden and may be frozen or killed before the
      // size/time ceiling fires — `visibilitychange → hidden` is the last beat
      // we can count on, notably on mobile. Force the unflushed tail to disk
      // now. A no-op until `init` has opened a sink.
      flush: () => {
        flushActive?.();
      },
    },
  });
};

/**
 * The worker's RPC surface, as seen by the host — a single `init` request
 * carrying a {@link LogLocation} and replying with the worker's writable log
 * stream. Derived from {@link createWorkerHandlers} rather than restated by
 * hand, so the contract can't drift from the handler that serves it.
 */
export type WorkerApi = ReturnType<typeof createWorkerHandlers>;
