import { type Logger, createLogger as createCoreLogger } from '@holz/core';
import { processor } from '#processor';

const baseLogger = createCoreLogger(processor);

/**
 * Create a namespaced logger. Pass `import.meta.INSTRUMENTATION_SCOPE`
 * — the build plugin fills it with `[packageName, ...modulePath]`,
 * matching otel's instrumentation-scope shape. Each element becomes
 * a segment of `log.origin`. Call `.namespace(...)` on the result to
 * add finer-grained tags (subsystem, class name, etc).
 *
 * The processor differs by runtime: the browser reads the `debug`
 * localStorage key and writes to the console; the server reads the
 * `DEBUG` env var, stays silent when `NODE_ENV === 'test'`, and
 * writes to stderr (ANSI when TTY, plain otherwise). Both wrap a
 * `log-collector` — `setGlobalLogCollector` from `@holz/log-collector`
 * intercepts logs without touching the env.
 */
export const createLogger = (scope: readonly string[]): Logger =>
  scope.reduce<Logger>(
    (logger, segment) => logger.namespace(segment),
    baseLogger,
  );

/**
 * The severity scale, as a map of name to numeric level (`trace` lowest,
 * `fatal` highest). Re-exported so consumers that interpret severities — a
 * log viewer labelling or coloring by level — read the canonical values
 * through this facade rather than reaching past it to `@holz/core`.
 */
export { level } from '@holz/core';

export type {
  Log,
  LogContext,
  Logger,
  LogLevel,
  LogProcessor,
} from '@holz/core';
