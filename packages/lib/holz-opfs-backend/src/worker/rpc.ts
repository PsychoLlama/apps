import { defineContract } from '@lib/messaging/rpc';
import type { SendOptions } from '@lib/messaging/message-port';

/**
 * The worker's durable log sink, as the RPC layer drives it — the single
 * OPFS-backed file that every log source (each connected tab, the worker's own
 * logs) writes into. Implemented by `./log-sink.ts`. The worker {@link
 * WorkerSink.open open}s it once at boot; the RPC handlers feed it whole NDJSON
 * lines via {@link WorkerSink.write write} and force a {@link WorkerSink.flush
 * flush} on demand.
 */
export interface WorkerSink {
  /**
   * Open the single durable log (idempotent). The worker calls this once as a
   * boot side effect — the file name is the worker's own constant, not
   * supplied per connection — so the sink is opening before the first tab
   * connects. Lines that race the open queue and drain in order once it lands.
   */
  open: () => Promise<void>;

  /**
   * Append one whole NDJSON line to the durable log. Tabs stream these in over
   * `log` events; the worker's own logs tee in separately (see
   * `./log-sink.ts`).
   */
  write: (chunk: Uint8Array) => void;

  /** Force the unflushed tail to disk now. A no-op before the sink opens. */
  flush: () => void;
}

/**
 * Build the worker's RPC handlers — the observability worker's end of the
 * boundary (see `../main/index.ts`). A {@link SharedWorker} binds one set of
 * handlers per connected tab, all funneling into the single injected {@link
 * WorkerSink}: tabs stream their logs in over `log` events — one whole NDJSON
 * line each — and fire `flush` to force the pending batch to disk early.
 *
 * There's no `init` request: the sink owns its file name and opens eagerly at
 * boot (see `./start.ts`), so a connecting tab has nothing to tell the worker —
 * it just starts streaming. A `log` event that beats the open queues in the
 * sink and drains in order once the file lands.
 *
 * The {@link WorkerSink} is injected rather than wired here so this module
 * stays a pure RPC contract, free of the OPFS runtime it would otherwise drag
 * in — the host imports {@link WorkerApi} from here to type its `notify`s, and
 * a type-only import shouldn't reach into `navigator.storage`.
 *
 * {@link WorkerApi} is derived from what this returns (via {@link
 * defineContract}), so the contract tracks the implementation — the worker-side
 * mirror of how the host derives its {@link HostApi} from the value it serves.
 */
export const createWorkerHandlers = (sink: WorkerSink) =>
  defineContract<SendOptions>()({
    requests: {},
    events: {
      // One whole NDJSON line from a connected tab. Append it to the durable
      // log. Fire-and-forget, but ordered: the transport delivers a tab's
      // events in send order, and `write` lands each line synchronously.
      log: (chunk: Uint8Array) => sink.write(chunk),

      // A tab's page went hidden and may be frozen or killed before the
      // size/time ceiling fires — `visibilitychange → hidden` is the last beat
      // we can count on, notably on mobile. Force the unflushed tail to disk
      // now. A no-op until the sink has opened.
      flush: () => sink.flush(),
    },
  });

/**
 * The worker's RPC surface, as seen by a connected tab — `log` and `flush`
 * events a tab streams NDJSON and forces flushes over, and no requests (the
 * worker opens its file on its own). Derived from {@link createWorkerHandlers}
 * rather than restated by hand, so the contract can't drift from the handler
 * that serves it.
 */
export type WorkerApi = ReturnType<typeof createWorkerHandlers>;
