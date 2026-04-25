import {
  logs,
  SeverityNumber,
  type LogAttributes,
  type LogBody,
} from '@opentelemetry/api-logs';

/**
 * Ergonomic logger facade over `@opentelemetry/api-logs`. One method per
 * severity level — no enum boilerplate at the call site.
 */
export interface AppLogger {
  /** Verbose detail useful for tracing fine-grained behavior. */
  debug(body: LogBody, attributes?: LogAttributes): void;
  /** Routine operational detail. The default for "something happened." */
  info(body: LogBody, attributes?: LogAttributes): void;
  /** Recoverable problem worth surfacing. */
  warn(body: LogBody, attributes?: LogAttributes): void;
  /** A failure. Routes to `console.error` in dev. */
  error(body: LogBody, attributes?: LogAttributes): void;
}

const wrap =
  (logger: ReturnType<typeof logs.getLogger>, severityNumber: SeverityNumber) =>
  (body: LogBody, attributes?: LogAttributes): void =>
    logger.emit({ severityNumber, body, attributes });

/**
 * Returns a logger for an instrumentation scope. Names are dot-separated
 * (`app.studio.recorder`, `lib.ui.button`). Multiple calls with the same
 * name share an underlying OTel logger.
 */
export const createLogger = (name: string): AppLogger => {
  const logger = logs.getLogger(name);
  return {
    debug: wrap(logger, SeverityNumber.DEBUG),
    info: wrap(logger, SeverityNumber.INFO),
    warn: wrap(logger, SeverityNumber.WARN),
    error: wrap(logger, SeverityNumber.ERROR),
  };
};
