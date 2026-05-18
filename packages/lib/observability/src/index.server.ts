import { env, stderr } from 'node:process';
import { createAnsiTerminalBackend } from '@holz/ansi-terminal-backend';
import { createLogger as createCoreLogger, filter } from '@holz/core';
import { createEnvironmentFilter } from '@holz/env-filter';
import { createLogCollector } from '@holz/log-collector';
import { createStreamBackend } from '@holz/stream-backend';
import { buildCreateLogger } from './create-logger';

const isColorTerminal = stderr.isTTY && stderr.getColorDepth() > 1;

const baseLogger = createCoreLogger(
  createLogCollector({
    fallback: filter(
      () => env.NODE_ENV !== 'test',
      createEnvironmentFilter({
        defaultPattern: '',
        processor: isColorTerminal
          ? createAnsiTerminalBackend()
          : createStreamBackend({ stream: stderr }),
      }),
    ),
  }),
);

/**
 * Create a namespaced logger. Pass `import.meta.INSTRUMENTATION_SCOPE`
 * — the build plugin fills it with `[packageName, ...modulePath]`,
 * matching otel's instrumentation-scope shape. Each element becomes
 * a segment of `log.origin`. Call `.namespace(...)` on the result to
 * add finer-grained tags (subsystem, class name, etc).
 *
 * Logs flow through a `log-collector` → `NODE_ENV !== 'test'` gate →
 * `env-filter` → ANSI TTY or plain `stderr` stream backend. The
 * pipeline is silent unless the `DEBUG` env var selects a matching
 * pattern. Use `setGlobalLogCollector` to intercept logs without
 * touching the env.
 */
export const createLogger = buildCreateLogger(baseLogger);

export {
  setGlobalLogCollector,
  unsetGlobalLogCollector,
} from '@holz/log-collector';
export type {
  Log,
  LogContext,
  Logger,
  LogLevel,
  LogProcessor,
} from '@holz/core';
