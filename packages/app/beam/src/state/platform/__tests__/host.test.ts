/**
 * Unit tests for the ambient host capabilities. They exist to be stubbed, so
 * what's worth checking is that the real ones answer honestly and that the
 * cancellable one actually cancels.
 */

import { AbortError } from '@lib/state';
import { newShareId, now, wait } from '../host';

describe('now', () => {
  it('reads the wall clock in epoch milliseconds', () => {
    const before = Date.now();

    const stamp = now();

    expect(stamp).toBeGreaterThanOrEqual(before);
    expect(stamp).toBeLessThanOrEqual(Date.now());
  });
});

describe('newShareId', () => {
  it('mints a fresh id each time', () => {
    expect(newShareId()).not.toBe(newShareId());
  });
});

describe('wait', () => {
  it('carries on once the time is up', async () => {
    await expect(
      wait(new AbortController().signal, 0),
    ).resolves.toBeUndefined();
  });

  it('refuses to start once the scope is already gone', async () => {
    const controller = new AbortController();
    controller.abort(new AbortError('gone'));

    await expect(wait(controller.signal, 1000)).rejects.toBeInstanceOf(
      AbortError,
    );
  });

  it('gives up when the scope is released mid-wait', async () => {
    const controller = new AbortController();
    const pending = wait(controller.signal, 10_000);

    controller.abort(new AbortError('released'));

    await expect(pending).rejects.toBeInstanceOf(AbortError);
  });
});
