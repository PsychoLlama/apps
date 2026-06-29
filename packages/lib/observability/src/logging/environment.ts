/**
 * `true` when running on the browser's main thread. Only the `Window` global
 * exposes `document`, which separates the page from its service and dedicated
 * workers; demanding the `Worker` constructor too rules out partial DOM shims
 * (jsdom defines `document` but not `Worker`) that would otherwise read as the
 * main thread.
 *
 * This is a runtime heuristic by necessity. The clean alternative — a
 * `worker`/`browser` import condition that resolves a different module per
 * realm — can't fire under `vite dev`, where Vite 7 bundles workers in the
 * shared `client` env (`worker.plugins` is build-only, `resolve.conditions` is
 * global). Vite 8's `worker.rolldownOptions.resolve.conditionNames` should let
 * us target realms with custom import conditions and drop this check; revisit
 * on the next bump.
 */
export const inMainThread = 'document' in globalThis && 'Worker' in globalThis;
