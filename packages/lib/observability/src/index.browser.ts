import { createConsoleBackend } from '@holz/console-backend';
import { type Logger, createLogger as createCoreLogger } from '@holz/core';
import { createEnvironmentFilter } from '@holz/env-filter';
import { createLogCollector } from '@holz/log-collector';

const baseLogger = createCoreLogger(
  createLogCollector({
    fallback: createEnvironmentFilter({
      processor: createConsoleBackend(),
      defaultPattern: '',
    }),
  }),
);

/**
 * Create a namespaced logger. Pass `import.meta.INSTRUMENTATION_SCOPE`
 * — the build plugin fills it with `[packageName, ...modulePath]`,
 * matching otel's instrumentation-scope shape. Each element becomes
 * a segment of `log.origin`. Call `.namespace(...)` on the result to
 * add finer-grained tags (subsystem, class name, etc).
 *
 * Logs flow through a `log-collector` → `env-filter` → `console-backend`
 * pipeline. The pipeline is silent unless the `debug` localStorage key
 * selects a matching pattern. Use `setGlobalLogCollector` from
 * `@holz/log-collector` to intercept logs without touching the env.
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
