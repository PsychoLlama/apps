import { level, type Log } from '@lib/observability';
import { groupLogsByDay } from '../group-logs-by-day';

/** A `Log` at a local wall-clock moment, with only `message` worth naming. */
const logAt = (
  message: string,
  ...local: [number, number, number, number?]
): Log => {
  const [year, month, day, hour = 0] = local;
  return {
    timestamp: new Date(year, month, day, hour).getTime(),
    message,
    level: level.info,
    origin: [],
    context: {},
  };
};

describe('groupLogsByDay', () => {
  it('returns no groups for an empty list', () => {
    expect(groupLogsByDay([])).toEqual([]);
  });

  it('collapses logs sharing a local calendar day into one group', () => {
    const groups = groupLogsByDay([
      logAt('morning', 2026, 5, 29, 9),
      logAt('evening', 2026, 5, 29, 21),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].logs.map((log) => log.message)).toEqual([
      'morning',
      'evening',
    ]);
  });

  it('splits logs on different days into separate groups', () => {
    const groups = groupLogsByDay([
      logAt('today', 2026, 5, 29, 12),
      logAt('yesterday', 2026, 5, 28, 12),
    ]);

    expect(groups.map((group) => group.logs.map((log) => log.message))).toEqual(
      [['today'], ['yesterday']],
    );
  });

  it('preserves input order across and within groups', () => {
    // Newest-first input: newest day leads, newest entry first inside it.
    const groups = groupLogsByDay([
      logAt('day2-late', 2026, 5, 29, 18),
      logAt('day2-early', 2026, 5, 29, 8),
      logAt('day1', 2026, 5, 28, 10),
    ]);

    expect(groups.map((group) => group.key)).toEqual([
      '2026-6-29',
      '2026-6-28',
    ]);
    expect(groups[0].logs.map((log) => log.message)).toEqual([
      'day2-late',
      'day2-early',
    ]);
  });

  it('regroups a day even when its entries are not contiguous', () => {
    const groups = groupLogsByDay([
      logAt('a', 2026, 5, 29, 9),
      logAt('b', 2026, 5, 28, 9),
      logAt('c', 2026, 5, 29, 9),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].logs.map((log) => log.message)).toEqual(['a', 'c']);
  });

  it('carries a non-empty localized heading for each day', () => {
    const [group] = groupLogsByDay([logAt('only', 2026, 5, 29, 9)]);

    // Locale-dependent text, so assert it resolved rather than its exact form.
    expect(group.heading.length).toBeGreaterThan(0);
  });
});
