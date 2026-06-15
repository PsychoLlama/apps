/**
 * Build the host's RPC handlers for the observability worker boundary — the
 * OPFS backend's end (see `logging/backends/opfs-worker.ts`). Today just the
 * worker's `ready` event, handled as a no-op.
 *
 * {@link HostApi} is derived from what this returns, so the contract tracks
 * the implementation — the host-side mirror of how the worker derives its
 * {@link WorkerApi} from the value it serves. The worker imports
 * {@link HostApi} to type its `notify('ready')`.
 *
 * Kept here, outside the backend's `Worker`-spawning module, so the worker can
 * pull {@link HostApi} across the boundary without dragging that graph into a
 * worker-typed build.
 */
export const createHostHandlers = () => ({
  events: {
    ready: () => {
      // The worker fires this the moment it boots. Nothing to do yet — later
      // work (OPFS sink readiness, flushing buffered logs) will key off it.
      // TODO: react to worker readiness.
    },
  },
});

/**
 * The host's RPC surface, as seen by the worker — a single `ready` event,
 * nothing else. Derived from {@link createHostHandlers} rather than restated
 * by hand, so the contract can't drift from the handler that serves it.
 */
export type HostApi = ReturnType<typeof createHostHandlers>;
