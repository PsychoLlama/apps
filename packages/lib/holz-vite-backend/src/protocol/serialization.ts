import type { Log, LogContext } from '@holz/core';
import {
  type ErrorObject,
  deserializeError,
  serializeError,
} from 'serialize-error';

/**
 * A {@link Log} in its wire form: plain JSON, safe to send over the Vite
 * socket. Identical to a `Log` except `context.error`, which travels as a
 * `serialize-error` object instead of an `Error` instance.
 */
export interface SerializedLog extends Omit<Log, 'context'> {
  readonly context: SerializedContext;
}

type SerializedContext = Omit<LogContext, 'error'> & { error?: ErrorObject };

/** Convert a log to its JSON-safe wire form. Inverse of {@link deserializeLog}. */
export const serializeLog = (log: Log): SerializedLog => {
  const { error, ...context } = log.context;

  return {
    timestamp: log.timestamp,
    message: log.message,
    level: log.level,
    origin: log.origin,
    context:
      error === undefined
        ? context
        : { ...context, error: serializeError(error) },
  };
};

/** Rebuild a log from its wire form. Inverse of {@link serializeLog}. */
export const deserializeLog = (log: SerializedLog): Log => {
  const { error, ...context } = log.context;

  // `LogContext` intersects `{ error?: Error }` with a JSON index signature,
  // which no object literal carrying an `Error` satisfies structurally.
  const hydrated =
    error === undefined
      ? context
      : ({ ...context, error: deserializeError(error) } as LogContext);

  return {
    timestamp: log.timestamp,
    message: log.message,
    level: log.level,
    origin: log.origin,
    context: hydrated,
  };
};
