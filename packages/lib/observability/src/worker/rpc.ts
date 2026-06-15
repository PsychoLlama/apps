/**
 * The observability worker's RPC surface — empty for now. The worker only
 * fires the host's `ready` event (see `../host-api.ts`) and serves no requests
 * of its own yet; future log-persistence handlers will land here.
 *
 * Declared so the host can name it as its `Remote`, mirroring how the worker
 * names {@link HostApi}. The explicit empty `requests`/`events` keep both call
 * surfaces typed as "no methods" rather than "any method".
 */
export interface WorkerApi {
  requests: Record<never, never>;
  events: Record<never, never>;
}
