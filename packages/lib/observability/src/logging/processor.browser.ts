import { createConsoleBackend } from '@holz/console-backend';
import type { LogProcessor } from '@holz/core';
import { createEnvironmentFilter } from '@holz/env-filter';
import { createLogCollector } from '@holz/log-collector';
import { devPattern } from './dev-pattern.ts';

const consoleBackend = createConsoleBackend();

// `ServiceWorkerGlobalScope` exposes neither `localStorage` nor
// `process.env`, so `createEnvironmentFilter` always lands on its empty
// default pattern and drops every SW log — there's no knob to set.
// Detect SW context at module load and skip the filter; callers running
// in a worker presumably want output, and `setGlobalLogCollector` still
// intercepts as usual.
//
// This is a runtime workaround. The clean fix is condition-based
// resolution, but Vite 7's worker bundle shares the `client` env in dev
// (`worker.plugins` is build-only, `resolve.conditions` is global), so
// there's no way to wire a `worker` import condition that fires in
// `vite dev`. Vite 8 — once Solid supports it — should expose
// `worker.rolldownOptions.resolve.conditionNames`, at which point this
// branch can be deleted in favor of a `processor.worker.ts` variant
// wired via the package's `imports` map. Revisit on the next bump.
const inServiceWorker = !('localStorage' in globalThis);

export const processor: LogProcessor = createLogCollector({
  fallback: inServiceWorker
    ? consoleBackend
    : createEnvironmentFilter({
        processor: consoleBackend,
        pattern: devPattern,
        defaultPattern: '',
      }),
});
