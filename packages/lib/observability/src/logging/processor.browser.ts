import { createConsoleBackend } from '@holz/console-backend';
import { type LogProcessor, combine } from '@holz/core';
import { createEnvironmentFilter } from '@holz/env-filter';
import { createLogCollector } from '@holz/log-collector';
import { createIdbBackend } from '@lib/holz-idb-backend';
import { devPattern } from './dev-pattern';

const consoleBackend = createConsoleBackend();

/**
 * `true` when running on the browser's main thread. Only the `Window` global
 * exposes `document`, which separates the page from its service and dedicated
 * workers; demanding the `Worker` constructor too rules out partial DOM shims
 * (jsdom defines `document` but not `Worker`) that would otherwise read as the
 * main thread.
 */
const inMainThread = 'document' in globalThis && 'Worker' in globalThis;

// The base log destination, chosen by the realm this module loads in. A global
// collector (`setGlobalLogCollector`) still intercepts upstream. Every browser
// realm persists to the same origin-shared IndexedDB store — `createIdbBackend`
// runs anywhere (main thread, dedicated workers, service workers), so there's
// no observability worker to spawn and no env-specific persistence path.
const selectFallback = (): LogProcessor => {
  const persistence = createIdbBackend();

  // Main thread: dev-filtered console plus persistence.
  if (inMainThread) {
    return combine([
      createEnvironmentFilter({
        processor: consoleBackend,
        pattern: devPattern,
        defaultPattern: '',
      }),
      persistence,
    ]);
  }

  // Any worker (service, QR scanner, …): console plus persistence. Workers
  // expose neither `localStorage` nor `process.env`, so `createEnvironmentFilter`
  // always lands on its empty default pattern and drops every log — there's no
  // knob to set. We skip the filter and write straight to the console; callers
  // running in a worker presumably want output.
  return combine([consoleBackend, persistence]);
};

export const processor: LogProcessor = createLogCollector({
  fallback: selectFallback(),
});
