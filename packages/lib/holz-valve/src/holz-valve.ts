import type { Log, LogProcessor } from '@holz/core';

/**
 * A gate over a log stream. Install {@link LogValve.processor} in a holz
 * pipeline and control the flow with {@link LogValve.open}/{@link
 * LogValve.close}.
 *
 * While open, logs stream straight through to the downstream processor. While
 * closed, logs are held in a fixed-size ring buffer (oldest overwritten once
 * full) and released in order the next time it opens.
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
   * log overwrites the oldest. Must be a non-negative integer; `0` keeps
   * nothing.
   */
  capacity: number;

  /** Downstream processor logs flow into once the gate is open. */
  processor: LogProcessor;
}

/**
 * Create a {@link LogValve}. Valves start open, streaming every log straight
 * through until {@link LogValve.close} is called.
 */
export const createLogValve = ({
  capacity,
  processor,
}: CreateLogValveOptions): LogValve => {
  // Fixed-size ring buffer. `start` points at the oldest entry; `size` counts
  // live entries. Writes land at `(start + size) % capacity` and, once full,
  // advance `start` to overwrite the oldest — no shifting.
  const buffer: Log[] = new Array<Log>(capacity);
  let start = 0;
  let size = 0;
  let isOpen = true;

  const enqueue = (log: Log) => {
    if (capacity === 0) return;

    buffer[(start + size) % capacity] = log;
    if (size < capacity) {
      size += 1;
    } else {
      start = (start + 1) % capacity;
    }
  };

  const drain = () => {
    for (let offset = 0; offset < size; offset += 1) {
      processor(buffer[(start + offset) % capacity]);
    }
    start = 0;
    size = 0;
  };

  const accept: LogProcessor = (log) => {
    if (isOpen) {
      return processor(log);
    }

    enqueue(log);
    return undefined;
  };

  return {
    processor: accept,

    open() {
      // Open before draining so a processor that logs back through the now-open
      // valve streams straight through instead of buffering behind the flush.
      isOpen = true;
      drain();
    },

    close() {
      isOpen = false;
    },
  };
};
