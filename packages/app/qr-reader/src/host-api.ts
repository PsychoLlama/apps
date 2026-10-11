/**
 * Build the host's RPC handlers for one decoder connection: a single `ready`
 * event the worker fires once its wasm module is live, wired to settle this
 * connection's readiness promise.
 *
 * {@link HostApi} is derived from what this returns, so the contract tracks
 * the implementation — the host-side mirror of how the worker derives its
 * `DecoderApi` from the handler value it serves.
 *
 * Lives in its own module, free of host runtime deps, so the worker can pull
 * {@link HostApi} across the boundary without dragging the host's
 * `Worker`-spawning graph into a worker-typed build.
 */
export const createHostHandlers = (onReady: () => void) => ({
  events: {
    ready: onReady,
  },
});

/**
 * The host's RPC surface, as seen by the worker — a one-shot `ready` event,
 * nothing else. Derived from {@link createHostHandlers} rather than restated
 * as a hand-written interface. The worker imports this type to type its
 * `notify('ready')`, just as the host imports `DecoderApi` to type its
 * requests.
 */
export type HostApi = ReturnType<typeof createHostHandlers>;
