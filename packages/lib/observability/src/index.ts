import type { Logger } from '@holz/core';
import { baseLogger } from '#pipeline';

/**
 * Create a namespaced logger. Pass `import.meta.INSTRUMENTATION_SCOPE`
 * — the build plugin fills it with `[packageName, ...modulePath]`,
 * matching otel's instrumentation-scope shape. Each element becomes
 * a segment of `log.origin`. Call `.namespace(...)` on the result to
 * add finer-grained tags (subsystem, class name, etc).
 *
 * The backend differs by runtime: the browser pipeline reads the
 * `debug` localStorage key and writes to the console; the server
 * pipeline reads the `DEBUG` env var, stays silent when
 * `NODE_ENV === 'test'`, and writes to stderr (ANSI when TTY, plain
 * otherwise). Both pipe through `log-collector` —
 * `setGlobalLogCollector` from `@holz/log-collector` intercepts logs
 * without touching the env.
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
