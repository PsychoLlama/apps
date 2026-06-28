import { defineContract } from '@lib/messaging/rpc';
import type { SendOptions } from '@lib/messaging/message-port';

/**
 * The writer worker's durable log sink, as the RPC layer drives it — the single
 * OPFS-backed file every log source funnels into. Implemented by
 * `./log-sink.ts`, in the dedicated writer worker (the only realm
 * `createSyncAccessHandle` is exposed in). The writer {@link WorkerSink.open
 * open}s it once at boot; the RPC handlers feed it whole NDJSON lines via {@link
 * WorkerSink.write write} and force a {@link WorkerSink.flush flush} on demand.
 */
export interface WorkerSink {
  /**
   * Open the single durable log (idempotent). The writer calls this once as a
   * boot side effect — the file name is the writer's own constant, not supplied
   * per connection — so the sink is opening before the hub forwards anything.
   * Lines that race the open queue and drain in order once it lands.
   */
  open: () => Promise<void>;

  /**
   * Append one whole NDJSON line to the durable log. The hub forwards these in
   * over `log` events — both tabs' logs and its own.
   */
  write: (chunk: Uint8Array) => void;

  /** Force the unflushed tail to disk now. A no-op before the sink opens. */
  flush: () => void;
}

/**
 * Build the writer worker's RPC handlers — the realm that owns the OPFS file
 * (see `./writer.ts`). The SharedWorker hub forwards every tab's logs (and its
 * own) over this one boundary: `log` events carry one whole NDJSON line each,
 * and `flush` forces the pending batch to disk early.
 *
 * There's no `init` request: the sink owns its file name and opens eagerly at
 * boot, so there's nothing to tell the writer — the hub just forwards. A `log`
 * event that beats the open queues in the sink and drains in order once the
 * file lands.
 *
 * The {@link WorkerSink} is injected rather than wired here so this module
 * stays a pure RPC contract, free of the OPFS runtime it would otherwise drag
 * in — the hub and host import {@link WorkerApi} from here to type their
 * `notify`s, and a type-only import shouldn't reach into `navigator.storage`.
 *
 * {@link WorkerApi} is derived from what this returns (via {@link
 * defineContract}), so the contract tracks the implementation — the worker-side
 * mirror of how the host derives its {@link HostApi} from the value it serves.
 */
export const createWorkerHandlers = (sink: WorkerSink) =>
  defineContract<SendOptions>()({
    requests: {},
    events: {
      // One whole NDJSON line the hub forwarded. Append it to the durable log.
      // Fire-and-forget, but ordered: the transport delivers in send order, and
      // `write` lands each line synchronously.
      log: (chunk: Uint8Array) => sink.write(chunk),

      // A tab's page went hidden and may be frozen or killed before the
      // size/time ceiling fires — `visibilitychange → hidden` is the last beat
      // we can count on, notably on mobile. The hub forwards that nudge here.
      // Force the unflushed tail to disk now. A no-op until the sink has opened.
      flush: () => sink.flush(),
    },
  });

/**
 * The writer worker's RPC surface, as seen by its callers (the SharedWorker hub
 * forwarding tab and own logs, and the main-thread host whose `notify`s the hub
 * relays) — `log` and `flush` events, and no requests (the writer opens its
 * file on its own). Derived from {@link createWorkerHandlers} rather than
 * restated by hand, so the contract can't drift from the handler that serves it.
 */
export type WorkerApi = ReturnType<typeof createWorkerHandlers>;
