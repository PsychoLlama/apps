import { type Logger, createLogger as createCoreLogger } from '@holz/core';
import { processor } from '#processor';

export { LOG_DIRECTORY, LOG_FILE_NAME } from './log-file.ts';
export { listLogFiles, type LogFileInfo } from './log-archive.ts';

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

export type {
  Log,
  LogContext,
  Logger,
  LogLevel,
  LogProcessor,
} from '@holz/core';
