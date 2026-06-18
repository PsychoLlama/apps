import { createConsoleBackend } from '@holz/console-backend';
import { type LogProcessor, combine } from '@holz/core';
import { createEnvironmentFilter } from '@holz/env-filter';
import { createLogCollector } from '@holz/log-collector';
import { createOpfsWorkerBackend } from './backends/opfs-worker.ts';
import { devPattern } from './dev-pattern.ts';
import { inMainThread, inObservabilityWorker } from './environment.ts';
import { getSelfLog } from './self-log.ts';

const consoleBackend = createConsoleBackend();

// The base log destination, chosen by the realm this module loads in. A global
// collector (`setGlobalLogCollector`) still intercepts upstream of all three.
const selectFallback = (): LogProcessor => {
  // Main thread: dev-filtered console plus off-main-thread persistence, which
  // spawns the observability worker (worker-only `createOpfsWorkerBackend`
  // would loop).
  if (inMainThread) {
    return combine([
      createEnvironmentFilter({
        processor: consoleBackend,
        pattern: devPattern,
        defaultPattern: '',
      }),
      createOpfsWorkerBackend(),
    ]);
  }

  // Inside the observability worker: persist our own logs to the same OPFS file
  // as the main thread. `getSelfLog().backend` buffers them; `../worker/`
  // drains that buffer into the shared durable sink once `init` opens the file
  // (see `./self-log.ts`). Console output too — see the note below on why it
  // skips the env filter.
  if (inObservabilityWorker) {
    return combine([consoleBackend, getSelfLog().backend]);
  }

  // Any other worker (service, QR scanner, …): console only. They expose
  // neither `localStorage` nor `process.env`, so `createEnvironmentFilter`
  // always lands on its empty default pattern and drops every log — there's no
  // knob to set. We skip the filter and write straight to the console; callers
  // running in a worker presumably want output.
  return consoleBackend;
};

export const processor: LogProcessor = createLogCollector({
  fallback: selectFallback(),
});
