/**
 * The host's RPC surface, as seen by the worker — empty. The host drives the
 * boundary by calling the worker's `init` request (see `./worker/rpc.ts`); it
 * serves no requests or events of its own. The explicit empty
 * `requests`/`events` keep both call surfaces typed as "no methods" rather than
 * "any method".
 *
 * Declared in its own module, outside the backend's `Worker`-spawning graph, so
 * the worker can name it as its `Remote` without that graph being dragged into
 * a worker-typed build.
 */
export interface HostApi {
  requests: Record<never, never>;
  events: Record<never, never>;
}
