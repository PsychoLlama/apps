import { createFlushScheduler } from '../flush-scheduler';

describe('createFlushScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not flush before either ceiling is reached', () => {
    const flush = vi.fn();
    const scheduler = createFlushScheduler(flush, { maxBytes: 100 });

    scheduler.record(60);

    expect(flush).not.toHaveBeenCalled();
  });

  it('flushes once the byte ceiling is reached', () => {
    const flush = vi.fn();
    const scheduler = createFlushScheduler(flush, { maxBytes: 100 });

    scheduler.record(60);
    scheduler.record(60);

    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('flushes a single record that alone exceeds the ceiling', () => {
    const flush = vi.fn();
    const scheduler = createFlushScheduler(flush, { maxBytes: 100 });

    scheduler.record(250);

    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('flushes a trickle once the staleness deadline elapses', () => {
    const flush = vi.fn();
    const scheduler = createFlushScheduler(flush, { maxDelayMs: 1_000 });

    scheduler.record(10);
    expect(flush).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1_000);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('arms the deadline once, so a steady stream still flushes on time', () => {
    const flush = vi.fn();
    const scheduler = createFlushScheduler(flush, {
      maxBytes: Infinity,
      maxDelayMs: 1_000,
    });

    scheduler.record(10);
    vi.advanceTimersByTime(500);

    // A later record must not push the deadline back.
    scheduler.record(10);
    vi.advanceTimersByTime(500);

    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('clears the pending deadline when a volume flush fires', () => {
    const flush = vi.fn();
    const scheduler = createFlushScheduler(flush, {
      maxBytes: 100,
      maxDelayMs: 1_000,
    });

    scheduler.record(60);
    scheduler.record(60); // crosses the ceiling, flushes
    expect(flush).toHaveBeenCalledTimes(1);

    // The deadline armed by the first record must not fire a second flush.
    vi.advanceTimersByTime(1_000);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('starts a fresh batch after each flush', () => {
    const flush = vi.fn();
    const scheduler = createFlushScheduler(flush, { maxBytes: 100 });

    scheduler.record(100); // flush #1
    scheduler.record(40); // below the ceiling again
    expect(flush).toHaveBeenCalledTimes(1);

    scheduler.record(60); // flush #2
    expect(flush).toHaveBeenCalledTimes(2);
  });

  it('flushes the pending batch on demand', () => {
    const flush = vi.fn();
    const scheduler = createFlushScheduler(flush, { maxDelayMs: 1_000 });

    scheduler.record(10);
    scheduler.flush();
    expect(flush).toHaveBeenCalledTimes(1);

    // The forced flush disarms the deadline — no second run.
    vi.advanceTimersByTime(1_000);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('is a no-op to flush when nothing is pending', () => {
    const flush = vi.fn();
    const scheduler = createFlushScheduler(flush);

    scheduler.flush();

    expect(flush).not.toHaveBeenCalled();
  });

  it('drops the pending batch on cancel without flushing', () => {
    const flush = vi.fn();
    const scheduler = createFlushScheduler(flush, { maxDelayMs: 1_000 });

    scheduler.record(10);
    scheduler.cancel();

    expect(flush).not.toHaveBeenCalled();

    // The armed deadline must not fire after cancel.
    vi.advanceTimersByTime(1_000);
    expect(flush).not.toHaveBeenCalled();
  });
});
