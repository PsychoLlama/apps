/** Tuning knobs for {@link createFlushScheduler}'s flush cadence. */
export interface BatchOptions {
  /**
   * Force a flush once this many unflushed bytes have accumulated. Bounds the
   * unflushed tail by size, so a burst can't outrun durability.
   */
  maxBytes?: number;

  /**
   * Force a flush this long (ms) after the first unflushed write. Bounds the
   * tail by staleness, so a slow trickle still lands. A hard crash within this
   * window forfeits the tail — an accepted trade for the throughput.
   */
  maxDelayMs?: number;
}

/** Defaults: a 64 KiB / 1s ceiling on the unflushed tail. */
const DEFAULT_OPTIONS: Required<BatchOptions> = {
  maxBytes: 64 * 1024,
  maxDelayMs: 1_000,
};

/**
 * Decides *when* to flush a write-through sink, knowing nothing about the sink
 * itself. Account for each write's size via {@link FlushScheduler.record}; the
 * scheduler runs the `flush` callback once either the byte ceiling or the
 * staleness deadline is reached, whichever comes first.
 */
export interface FlushScheduler {
  /** Account for a write of `byteLength` bytes; may run `flush` synchronously. */
  record(byteLength: number): void;

  /** Run a pending flush now — e.g. before closing the sink. No-op if idle. */
  flush(): void;

  /** Drop a pending flush without running it — e.g. on abort. */
  cancel(): void;
}

/**
 * Build a {@link FlushScheduler} that invokes `flush` on a size/time policy.
 * The staleness deadline is armed once on the first unflushed write and not
 * reset by later writes, so a steady stream can't starve flushes indefinitely.
 */
export const createFlushScheduler = (
  flush: () => void,
  options: BatchOptions = {},
): FlushScheduler => {
  const { maxBytes, maxDelayMs } = { ...DEFAULT_OPTIONS, ...options };

  let pending = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const disarm = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  const run = (): void => {
    disarm();
    if (pending === 0) return;
    pending = 0;
    flush();
  };

  return {
    record(byteLength) {
      pending += byteLength;
      if (pending >= maxBytes) run();
      else timer ??= setTimeout(run, maxDelayMs);
    },
    flush: run,
    cancel() {
      disarm();
      pending = 0;
    },
  };
};
