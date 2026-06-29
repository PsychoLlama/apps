import type { Log, LogProcessor } from '@holz/core';

/**
 * A gate over a log stream. Install {@link LogValve.processor} in a holz
 * pipeline and control the flow with {@link LogValve.open}/{@link
 * LogValve.close}.
 *
 * While open, logs stream straight through to the downstream processor. While
 * closed, logs are held in a ring buffer that grows to `capacity` (oldest
 * overwritten once full) and released in order the next time it opens.
 */
export interface LogValve {
  /**
   * The processor to install upstream in a holz pipeline. Logs enter here and
   * are either forwarded (open) or buffered (closed).
   */
  processor: LogProcessor;

  /** Flush buffered logs through the processor and stream them going forward. */
  open(): void;

  /** Close the gate. Begin buffering logs. */
  close(): void;
}

/** Options for {@link createLogValve}. */
export interface CreateLogValveOptions {
  /**
   * How many logs the ring buffer retains while closed. Once full, each new
   * log overwrites the oldest. A non-negative integer or `Infinity`; `0` keeps
   * nothing, `Infinity` (the default) is unbounded.
   */
  capacity?: number;

  /** Downstream processor logs flow into once the gate is open. */
  processor: LogProcessor;
}

/**
 * Create a {@link LogValve}. Valves start open, streaming every log straight
 * through until {@link LogValve.close} is called.
 */
export const createLogValve = ({
  capacity = Infinity,
  processor: forward,
}: CreateLogValveOptions): LogValve => {
  // Ring buffer that grows lazily up to `capacity`, then overwrites in place.
  // Starting empty and pushing keeps the array packed — no holes for V8 to
  // deopt on, and no giant up-front allocation when `capacity` is large or
  // Infinity. `oldest` indexes the oldest entry (the next slot to overwrite
  // once full); in the growth phase it stays 0.
  const buffer: Log[] = [];
  let oldest = 0;
  let isOpen = true;

  const enqueue = (log: Log) => {
    if (buffer.length < capacity) {
      buffer.push(log);
    } else if (capacity > 0) {
      buffer[oldest] = log;
      oldest = (oldest + 1) % capacity;
    }
  };

  const drain = () => {
    const count = buffer.length;
    for (let offset = 0; offset < count; offset += 1) {
      forward(buffer[(oldest + offset) % count]);
    }

    buffer.length = 0;
    oldest = 0;
  };

  const processor: LogProcessor = (log) => {
    if (isOpen) {
      forward(log);
    } else {
      enqueue(log);
    }
  };

  const open = () => {
    // Open before draining so a processor that logs back through the now-open
    // valve streams straight through instead of buffering behind the flush.
    isOpen = true;
    drain();
  };

  const close = () => {
    isOpen = false;
  };

  return { processor, open, close };
};
