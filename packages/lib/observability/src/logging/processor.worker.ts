import { createConsoleBackend } from '@holz/console-backend';
import type { LogProcessor } from '@holz/core';
import { createLogCollector } from '@holz/log-collector';

// Service workers have no `localStorage` and no `process.env`, so the
// browser processor's `createEnvironmentFilter` always falls through to
// its empty default pattern — every log gets dropped. This variant skips
// the env filter and always logs to the console; SW logging is opt-in
// at the import site, so callers asking for it presumably want output.
// `createLogCollector` still lets `setGlobalLogCollector` consumers
// intercept (e.g. forward to clients via `postMessage`).
export const processor: LogProcessor = createLogCollector({
  fallback: createConsoleBackend(),
});
