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
