import { createLogger, type Logger, type LogProcessor } from '@holz/core';

import type { SpanProcessor } from './processor/processor';

/**
 * A time source. Returns a Unix timestamp in milliseconds, fractional
 * digits included.
 */
type Clock = () => number;

/** A source of randomness. Returns the requested number of bytes. */
type RandomSource = (count: number) => Uint8Array;

const createPerformanceClock = (): Clock => {
  const { timeOrigin } = performance;

  return () => timeOrigin + performance.now();
};

const getSecureRandomBytes: RandomSource = (count) =>
  crypto.getRandomValues(new Uint8Array(count));

/** Configuration for `configure`. */
export interface TracerConfig {
  /** Where spans read the time from. Defaults to the `performance` clock. */
  getCurrentTime?: Clock;

  /** Where random bytes come from. Defaults to `crypto.getRandomValues`. */
  getRandomBytes?: RandomSource;

  /** Receives every span. Provides all tracing behavior. */
  processor: SpanProcessor;

  /** Logging configuration. */
  holz: {
    /** Receives everything logged through `span.log`. */
    processor: LogProcessor;
  };
}

/** Resolved configuration, shared by a tracer and all of its spans. */
export interface Context {
  /** The time source spans read from. */
  readonly getCurrentTime: Clock;

  /** The source of random bytes. */
  readonly getRandomBytes: RandomSource;

  /** Receives every span. */
  readonly processor: SpanProcessor;

  /** The logger spans write through. */
  readonly log: Logger;
}

/** Resolve a {@link TracerConfig}, applying defaults. */
export const createContext = (config: TracerConfig): Context => ({
  getCurrentTime: config.getCurrentTime ?? createPerformanceClock(),
  getRandomBytes: config.getRandomBytes ?? getSecureRandomBytes,
  processor: config.processor,
  log: createLogger(config.holz.processor),
});
