import { createConsoleBackend } from '@holz/console-backend';
import { type LogProcessor, combine } from '@holz/core';
import { createEnvironmentFilter } from '@holz/env-filter';
import { createLogCollector } from '@holz/log-collector';
import { createOpfsWorkerBackend } from './backends/opfs-worker.ts';
import { devPattern } from './dev-pattern.ts';
import { inMainThread } from './environment.ts';

const consoleBackend = createConsoleBackend();

// Workers (service and dedicated) expose neither `localStorage` nor
// `process.env`, so `createEnvironmentFilter` always lands on its empty
// default pattern and drops every log — there's no knob to set. Off the
// main thread we skip the filter and write straight to the console; callers
// running in a worker presumably want output. `setGlobalLogCollector` still
// intercepts upstream either way.
const fallback: LogProcessor = inMainThread
  ? combine([
      createEnvironmentFilter({
        processor: consoleBackend,
        pattern: devPattern,
        defaultPattern: '',
      }),
      // Off-main-thread persistence. Spawns the observability worker, so it's
      // main-thread only — `createOpfsWorkerBackend` would loop from a worker.
      createOpfsWorkerBackend(),
    ])
  : consoleBackend;

export const processor: LogProcessor = createLogCollector({ fallback });
