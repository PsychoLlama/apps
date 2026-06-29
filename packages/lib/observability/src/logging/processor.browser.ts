import { createConsoleBackend } from '@holz/console-backend';
import { type LogProcessor, combine, filter } from '@holz/core';
import { createEnvironmentFilter } from '@holz/env-filter';
import { createLogCollector } from '@holz/log-collector';
import { createIdbBackend } from '@lib/holz-idb-backend';
import { devPattern } from './dev-pattern';
import { inMainThread } from './environment';

const consoleBackend = createConsoleBackend();

// Under Vitest `import.meta.env.DEV` is true, which flips `devPattern` to `'*'`
// and forces every log to the console — and the worker branch below writes to
// the console unconditionally. Mirror the server processor's `NODE_ENV` guard
// and stay silent under test so suites don't spew log noise. `import.meta.env`
// is statically replaced, so non-test bundles fold this to `true`.
const notTest = import.meta.env.MODE !== 'test';

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
  fallback: filter(() => notTest, selectFallback()),
});
