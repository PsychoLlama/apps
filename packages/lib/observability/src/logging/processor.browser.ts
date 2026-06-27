import { createConsoleBackend } from '@holz/console-backend';
import { type LogProcessor, combine } from '@holz/core';
import { createEnvironmentFilter } from '@holz/env-filter';
import { createLogCollector } from '@holz/log-collector';
import {
  createOpfsWorkerBackend,
  getWorkerLogBuffer,
  inMainThread,
  inObservabilityWorker,
} from '@lib/holz-opfs-backend';
import { devPattern } from './dev-pattern';

const consoleBackend = createConsoleBackend();

// The base log destination, chosen by the realm this module loads in. A global
// collector (`setGlobalLogCollector`) still intercepts upstream of all three.
const selectFallback = (): LogProcessor => {
  // Main thread: dev-filtered console, plus off-main-thread persistence when
  // the platform offers it. `createOpfsWorkerBackend` connects to the shared
  // observability worker (it's main-thread-only — calling it inside the worker
  // would loop), but only where `SharedWorker` exists: without it there's no
  // single writer for the shared OPFS file, so we skip persistence and log to
  // the console alone rather than fall back to a per-tab file.
  if (inMainThread) {
    const envFilteredConsole = createEnvironmentFilter({
      processor: consoleBackend,
      pattern: devPattern,
      defaultPattern: '',
    });

    return 'SharedWorker' in globalThis
      ? combine([envFilteredConsole, createOpfsWorkerBackend()])
      : envFilteredConsole;
  }

  // Inside the observability worker: persist our own logs to the same OPFS file
  // as every tab. `getWorkerLogBuffer().backend` buffers them; the
  // `@lib/holz-opfs-backend` worker drains that buffer into the shared durable
  // sink once it opens the file. Console output too — see the note below on
  // why it skips the env filter.
  if (inObservabilityWorker) {
    return combine([consoleBackend, getWorkerLogBuffer().backend]);
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
