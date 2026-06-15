/**
 * Build the host's RPC handlers for the observability worker boundary — the
 * OPFS backend's end (see `logging/backends/opfs-worker.ts`). The worker's
 * `ready` event hands over the writable end of its log stream; `onReady`
 * forwards it to the backend, which attaches its JSON sink.
 *
 * `onReady` is injected rather than wired here so this module stays free of the
 * `Worker`-spawning backend graph (see below) — it only relays the stream.
 *
 * {@link HostApi} is derived from what this returns, so the contract tracks
 * the implementation — the host-side mirror of how the worker derives its
 * {@link WorkerApi} from the value it serves. The worker imports
 * {@link HostApi} to type its `notify('ready', …)`.
 *
 * Kept here, outside the backend's `Worker`-spawning module, so the worker can
 * pull {@link HostApi} across the boundary without dragging that graph into a
 * worker-typed build.
 */
export const createHostHandlers = (
  onReady: (stream: WritableStream<Uint8Array>) => void,
) => ({
  // The worker fires `ready` on boot, handing us the writable end of its log
  // bridge; `onReady` is the backend's hook to attach the JSON sink to it.
  events: { ready: onReady },
});

/**
 * The host's RPC surface, as seen by the worker — a single `ready` event
 * carrying the worker's writable log stream, nothing else. Derived from
 * {@link createHostHandlers} rather than restated by hand, so the contract
 * can't drift from the handler that serves it.
 */
export type HostApi = ReturnType<typeof createHostHandlers>;
