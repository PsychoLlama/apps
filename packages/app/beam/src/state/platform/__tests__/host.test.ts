/**
 * Unit tests for the ambient host capabilities. They exist to be stubbed, so
 * what's worth checking is that the real ones answer honestly.
 */

import { newShareId, now } from '../host';

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
