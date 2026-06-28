import type { Log, LogProcessor } from '@holz/core';

/**
 * A gate over a log stream. Install it as a {@link LogProcessor} in a holz
 * pipeline and control the flow with {@link LogValve.open}/{@link
 * LogValve.close}.
 *
 * While open, logs stream straight through to the downstream processor. While
 * closed, logs are held in a bounded buffer (oldest dropped first once full)
 * and released in order the next time it opens.
 */
export interface LogValve extends LogProcessor {
  /** Flush queued logs through the processor and stream them going forward. */
  open(): void;

  /** Close the gate. Begin queuing logs. */
  close(): void;

  /**
   * Adjust how many logs the buffer can hold while closed. `0` keeps nothing,
   * `Infinity` keeps everything. Shrinking below the current backlog drops the
   * oldest logs to fit.
   */
  setCapacity(capacity: number): void;
}

/** Options for {@link createLogValve}. */
export interface CreateLogValveOptions {
  /**
   * Greatest number of logs to retain while closed. `0` for none, `Infinity`
   * for no limit. Defaults to `Infinity`.
   */
  capacity?: number;

  /** Downstream processor logs flow into once the gate is open. */
  processor: LogProcessor;
}

/**
 * Create a {@link LogValve}. Valves start open, streaming every log straight
 * through until {@link LogValve.close} is called.
 */
export const createLogValve = (options: CreateLogValveOptions): LogValve => {
  const { processor } = options;

  // Stub: a transparent pass-through. The real implementation — buffering
  // while closed up to `options.capacity` and flushing on open — lands next.
  return Object.assign((log: Log) => processor(log), {
    open: () => {},
    close: () => {},
    setCapacity: () => {},
  });
};
