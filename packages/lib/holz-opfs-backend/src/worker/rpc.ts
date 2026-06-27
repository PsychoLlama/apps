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
 * The worker's durable log sink, as the RPC layer drives it — the OPFS-backed
 * file that every log source (the host, the worker's own logs, eventually
 * other workers) writes into. Implemented by `./log-sink.ts`; the RPC handlers
 * `open` it once, then feed it whole NDJSON lines via `write` and force a
 * `flush` on demand.
 */
export interface WorkerSink {
  /**
   * Open the durable log (idempotent). The host owns the file name, delivered
   * in `init`, and awaits this before streaming so every log lands after the
   * file exists.
   */
  open: (location: LogLocation) => Promise<void>;

  /**
   * Append one whole NDJSON line to the durable log. The host streams these in
   * over `log` events; the worker's own logs tee in separately (see
   * `./log-sink.ts`).
   */
  write: (chunk: Uint8Array) => void;

  /** Force the unflushed tail to disk now. A no-op before the first `open`. */
  flush: () => void;
}

/**
 * Build the worker's RPC handlers — the observability worker's end of the
 * boundary (see `../main/index.ts`). The host calls `init` once with where to
 * write; the worker opens that file and replies when it's ready. The host then
 * streams its logs in over `log` events — one whole NDJSON line each — and
 * fires `flush` to force the pending batch to disk early.
 *
 * The {@link WorkerSink} is injected rather than wired here so this module
 * stays a pure RPC contract, free of the OPFS runtime it would otherwise drag
 * in — the host imports {@link WorkerApi} from here to type its
 * `request('init', …)`, and a type-only import shouldn't reach into
 * `navigator.storage`.
 *
 * {@link WorkerApi} is derived from what this returns (via {@link
 * defineContract}), so the contract tracks the implementation — the worker-side
 * mirror of how the host derives its {@link HostApi} from the value it serves.
 */
export const createWorkerHandlers = (sink: WorkerSink) =>
  defineContract<SendOptions>()({
    requests: {
      // Open the host-named log file so the sink is ready before the first log
      // event arrives. Replies with nothing — the host waits on this only to
      // sequence its `log` stream after the file exists.
      init: async (location: LogLocation) => {
        await sink.open(location);
      },
    },
    events: {
      // One whole NDJSON line from the host. Append it to the durable log.
      // Fire-and-forget, but ordered: the host streams these only after `init`
      // resolves, and the transport delivers them in send order.
      log: (chunk: Uint8Array) => sink.write(chunk),

      // The host's page went hidden and may be frozen or killed before the
      // size/time ceiling fires — `visibilitychange → hidden` is the last beat
      // we can count on, notably on mobile. Force the unflushed tail to disk
      // now. A no-op until `init` has opened the sink.
      flush: () => sink.flush(),
    },
  });

/**
 * The worker's RPC surface, as seen by the host — an `init` request carrying a
 * {@link LogLocation}, plus `log` and `flush` events the host streams NDJSON
 * and forces flushes over. Derived from {@link createWorkerHandlers} rather
 * than restated by hand, so the contract can't drift from the handler that
 * serves it.
 */
export type WorkerApi = ReturnType<typeof createWorkerHandlers>;
