/**
 * `true` when running on the browser's main thread.
 *
 * Only the `Window` global exposes `document`, which separates the page from
 * its service and dedicated workers — neither can host main-thread-only work
 * like spawning a `Worker`. We additionally require the `Worker` constructor:
 * it's what that work actually needs, and demanding it rules out partial DOM
 * shims (jsdom defines `document` but not `Worker`) that would otherwise read
 * as the main thread.
 *
 * This is a runtime heuristic by necessity. The clean alternative — a
 * `worker`/`browser` import condition — can't fire under `vite dev`, where
 * Vite 7 bundles workers in the shared `client` env (`worker.plugins` is
 * build-only, `resolve.conditions` is global). Vite 8's
 * `worker.rolldownOptions.resolve.conditionNames` should unlock it; revisit
 * on the next bump.
 */
export const inMainThread = 'document' in globalThis && 'Worker' in globalThis;

/**
 * The `name` the observability worker is spawned with (see
 * `./main/index.ts`). Load-bearing, not cosmetic: it's how a worker
 * realm recognizes itself as *the* observability worker — the one that owns
 * the OPFS log file — and so persists its own logs (see {@link
 * inObservabilityWorker}). It doubles as the DevTools thread label. Change it
 * in one place; both uses follow.
 */
export const OBSERVABILITY_WORKER_NAME = 'Observability';

/**
 * `true` only inside the observability worker itself — distinct from any other
 * worker (the service worker, the QR scanner). Code there persists its own
 * logs to the shared OPFS file; every other worker logs to the console alone.
 *
 * Keyed off `self.name`, which the runtime sets at construction, so this is
 * available immediately and never depends on module-evaluation order. Guarded
 * by `!inMainThread` so it never reads the unrelated `window.name` on the main
 * thread (`self` is the worker global only in the else case).
 */
export const inObservabilityWorker =
  !inMainThread && self.name === OBSERVABILITY_WORKER_NAME;
