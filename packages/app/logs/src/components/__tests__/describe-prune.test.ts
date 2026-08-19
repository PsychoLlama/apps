import { describePrune } from '../describe-prune';

describe('describePrune', () => {
  it('names the count and the day the logs were dropped', () => {
    // The suite is pinned to UTC, so the formatted day is the timestamp's UTC
    // day rather than whatever the host machine calls it.
    expect(
      describePrune({ deleted: 2000, timestamp: Date.UTC(2026, 5, 29, 12) }),
    ).toBe('2,000 logs deleted on June 29, 2026');
  });

  it('reads as a sentence when a pass dropped a single log', () => {
    expect(
      describePrune({ deleted: 1, timestamp: Date.UTC(2026, 5, 29, 12) }),
    ).toBe('1 log deleted on June 29, 2026');
  });
});
