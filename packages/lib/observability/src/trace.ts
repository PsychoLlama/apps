import {
  SpanStatusCode,
  trace,
  type Exception,
  type Span,
} from '@opentelemetry/api';

/**
 * Ergonomic tracer facade. `span()` runs a callback inside a span and
 * handles `end()` plus exception recording automatically. Works for both
 * sync and async callbacks — the return value is whatever the callback
 * returns (or a `Promise` of it).
 */
export interface AppTracer {
  span<T>(name: string, fn: (span: Span) => T): T;
}

const finishWithError = (span: Span, error: unknown): void => {
  span.recordException(error as Exception);
  span.setStatus({ code: SpanStatusCode.ERROR });
  span.end();
};

/**
 * Returns a tracer for an instrumentation scope. Names match the logger
 * convention (`app.studio.recorder`).
 */
export const createTracer = (name: string): AppTracer => {
  const tracer = trace.getTracer(name);
  return {
    span: <T>(spanName: string, fn: (span: Span) => T): T => {
      const span = tracer.startSpan(spanName);
      try {
        const result = fn(span);
        if (result instanceof Promise) {
          const settled = (result as Promise<unknown>).then(
            (value) => {
              span.end();
              return value;
            },
            (error: unknown) => {
              finishWithError(span, error);
              throw error;
            },
          );
          return settled as T;
        }
        span.end();
        return result;
      } catch (error) {
        finishWithError(span, error);
        throw error;
      }
    },
  };
};
