import { createConsoleBackend } from '@holz/console-backend';
import { type LogProcessor, combine, filter } from '@holz/core';
import { createLogCollector } from '@holz/log-collector';
import { createConfigFilter } from '@lib/holz-config-filter';
import { createIdbBackend } from '@lib/holz-idb-backend';
// Aliased: `filter` (the log-pattern option) collides with `@holz/core`'s
// `filter` operator imported above.
import { filter as logFilter } from '../config';

// Under Vitest `import.meta.env.MODE` is `'test'`. Mirror the server
// processor's `NODE_ENV` guard and stay silent so suites don't spew log
// noise. `import.meta.env` is statically replaced, so non-test bundles fold
// this to `true` and drop the gate.
const notTest = import.meta.env.MODE !== 'test';

// The base destination for every browser realm: a config-filtered console
// plus origin-shared IndexedDB persistence. A global collector
// (`setGlobalLogCollector`) still intercepts upstream. Both halves run
// anywhere — `createIdbBackend` and the OPFS-backed pattern read work on the
// main thread and in workers (service, QR scanner, …) alike — so there's no
// realm-specific branch and, unlike the `localStorage` env filter, workers
// get the same filtering knob as the page.
export const processor: LogProcessor = createLogCollector({
  fallback: filter(
    () => notTest,
    combine([
      createConfigFilter({
        option: logFilter,
        processor: createConsoleBackend(),
      }),
      createIdbBackend(),
    ]),
  ),
});
