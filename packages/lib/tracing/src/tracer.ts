import { createLogger, type LogProcessor } from '@holz/core';

import type { TraceProcessor } from './processor';
import type { Span } from './span';

/**
 * A time source. Returns a Unix timestamp in milliseconds, fractional
 * digits included.
 *
 * @example () => performance.timeOrigin + performance.now()
 */
type Clock = () => number;

/** Configuration for {@link configure}. */
export interface TracerConfig {
  /** Where spans read the time from. */
  getCurrentTime: Clock;

  /** Receives every span. Provides all tracing behavior. */
  processor: TraceProcessor;

  /** Logging configuration. */
  holz: {
    /** Receives everything logged through `span.log`. */
    processor: LogProcessor;
  };
}

/**
 * The top-level tracing context. Not a span itself: it has no lifecycle,
 * and is where process-wide concerns are configured.
 */
export interface Tracer {
  /** The time source spans read from. */
  readonly getCurrentTime: Clock;

  /** Create a span. */
  span: (name: string) => Span;
}

/** Create the top-level {@link Tracer}. Usually called once per realm. */
export const configure = (config: TracerConfig): Tracer => {
  const log = createLogger(config.holz.processor);

  return {
    getCurrentTime: config.getCurrentTime,
    span: (name) => {
      const span: Span = { name, log };

      // The handler goes unused until spans can apply actions.
      config.processor(span);

      return span;
    },
  };
};
