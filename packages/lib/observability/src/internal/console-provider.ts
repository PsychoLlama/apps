/* eslint-disable no-console -- console output is the entire point of this module. */
import {
  SeverityNumber,
  type Logger,
  type LoggerProvider,
  type LogRecord,
} from '@opentelemetry/api-logs';

const consoleFor = (
  severity: SeverityNumber,
): ((...data: unknown[]) => void) => {
  if (severity >= SeverityNumber.ERROR) return console.error;
  if (severity >= SeverityNumber.WARN) return console.warn;
  if (severity >= SeverityNumber.INFO) return console.info;
  return console.debug;
};

const createConsoleLogger = (name: string): Logger => ({
  emit(record: LogRecord): void {
    const severity = record.severityNumber ?? SeverityNumber.INFO;
    consoleFor(severity)(
      `[${SeverityNumber[severity]}] ${name}`,
      record.body,
      record.attributes,
    );
  },
  enabled(): boolean {
    return true;
  },
});

/**
 * Builds a `LoggerProvider` that emits log records to the host console.
 * Severity routes to the matching `console` method (`error`, `warn`,
 * `info`, `debug`). Suitable for development; swap for an exporter-backed
 * provider in production.
 */
export const createConsoleLoggerProvider = (): LoggerProvider => ({
  getLogger(name: string): Logger {
    return createConsoleLogger(name);
  },
});
