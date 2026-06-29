import type { Log, LogProcessor } from '@holz/core';

/**
 * Releases a batch of buffered logs in one call when the gate opens. Distinct
 * from the per-log {@link LogProcessor} so a downstream that benefits from
 * batching — one IndexedDB transaction for the whole flush rather than a write
 * per log — gets the entire buffer at once, in arrival order.
 */
export type LogDrain = (logs: Log[]) => void;

/**
 * A gate over a log stream. Install {@link LogValve.processor} in a holz
 * pipeline and control the flow with {@link LogValve.open}/{@link
 * LogValve.close}.
 *
 * While open, logs stream straight through to the downstream processor one at a
 * time. While closed, logs are held in a ring buffer that grows to `capacity`
 * (oldest overwritten once full) and released as a single batch through the
 * drain callback the next time it opens.
 */
export interface LogValve {
  /**
   * The processor to install upstream in a holz pipeline. Logs enter here and
   * are either forwarded (open) or buffered (closed).
   */
  processor: LogProcessor;

  /** Flush buffered logs through the drain callback and stream onward. */
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

  /** Downstream processor each log streams into while the gate is open. */
  processor: LogProcessor;

  /**
   * Sink for the buffer accumulated while closed, released as one batch when
   * the gate opens. Receives the held logs in arrival order so a downstream can
   * persist them together — e.g. a single IndexedDB transaction per flush.
   */
  drain: LogDrain;

  /**
   * Whether the valve starts open. `true` streams logs straight through from
   * the first one; `false` starts closed, buffering until the first
   * {@link LogValve.open} — handy when the downstream isn't ready yet. Required:
   * the initial gate state is a decision every caller should make deliberately.
   */
  open: boolean;
}

/**
 * Create a {@link LogValve}. Pass `open: true` to stream every log straight
 * through until {@link LogValve.close} is called, or `open: false` to start
 * closed and buffer until the first {@link LogValve.open}.
 */
export const createLogValve = ({
  capacity = Infinity,
  processor: forward,
  drain,
  open: startOpen,
}: CreateLogValveOptions): LogValve => {
  // Ring buffer that grows lazily up to `capacity`, then overwrites in place.
  // Starting empty and pushing keeps the array packed — no holes for V8 to
  // deopt on, and no giant up-front allocation when `capacity` is large or
  // Infinity. `oldest` indexes the oldest entry (the next slot to overwrite
  // once full); in the growth phase it stays 0.
  const buffer: Log[] = [];
  let oldest = 0;
  let isOpen = startOpen;

  const enqueue = (log: Log) => {
    if (buffer.length < capacity) {
      buffer.push(log);
    } else if (capacity > 0) {
      buffer[oldest] = log;
      oldest = (oldest + 1) % capacity;
    }
  };

  const processor: LogProcessor = (log) => {
    if (isOpen) {
      forward(log);
    } else {
      enqueue(log);
    }
  };

  const open = () => {
    // Open before draining so a log emitted back through the now-open valve —
    // including from within `drain` itself — streams straight through instead
    // of buffering behind the flush.
    isOpen = true;

    if (buffer.length === 0) return;

    // Lift the ring into a flat, arrival-ordered batch and hand the whole thing
    // to `drain` in one call. The buffer holds two contiguous runs — `oldest` to
    // the end, then the start up to `oldest` — so joining those slices restores
    // arrival order. Both slices are fresh, so resetting the buffer next can't
    // disturb the batch, and a re-entrant log lands in the cleared buffer rather
    // than one already released.
    const batch = buffer.slice(oldest).concat(buffer.slice(0, oldest));
    buffer.length = 0;
    oldest = 0;

    drain(batch);
  };

  const close = () => {
    isOpen = false;
  };

  return { processor, open, close };
};
