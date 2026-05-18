import { env, stderr } from 'node:process';
import { createAnsiTerminalBackend } from '@holz/ansi-terminal-backend';
import {
  type Logger,
  createLogger as createCoreLogger,
  filter,
} from '@holz/core';
import { createEnvironmentFilter } from '@holz/env-filter';
import { createLogCollector } from '@holz/log-collector';
import { createStreamBackend } from '@holz/stream-backend';

// Cached at module load. The filter runs on every log, so we don't
// want to re-touch `process.env` (and re-do its proxy traps) per call.
const { NODE_ENV } = env;
const isColorTerminal = stderr.isTTY && stderr.getColorDepth() > 1;

const baseLogger = createCoreLogger(
  createLogCollector({
    fallback: filter(
      () => NODE_ENV !== 'test',
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
 * pattern. Use `setGlobalLogCollector` from `@holz/log-collector` to
 * intercept logs without touching the env.
 */
export const createLogger = (scope: readonly string[]): Logger =>
  scope.reduce<Logger>(
    (logger, segment) => logger.namespace(segment),
    baseLogger,
  );

export type {
  Log,
  LogContext,
  Logger,
  LogLevel,
  LogProcessor,
} from '@holz/core';
