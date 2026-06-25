import {
  formatSessionLabel,
  formatSessionTime,
  groupSessionsByDay,
  type LogFileInfo,
} from '../log-archive';

describe('formatSessionLabel', () => {
  it('falls back to the raw name when there is no timestamp prefix', () => {
    expect(formatSessionLabel('legacy.ndjson')).toBe('legacy.ndjson');
  });

  it('formats the parsed timestamp into something human-readable', () => {
    const label = formatSessionLabel('1700000000000-abcd1234.ndjson');

    expect(label).not.toBe('1700000000000-abcd1234.ndjson');
    expect(label.length).toBeGreaterThan(0);
  });
});

describe('formatSessionTime', () => {
  const file = (createdAt: number | undefined): LogFileInfo => ({
    name: 'session.ndjson',
    createdAt,
  });

  it('falls back to the file name when the timestamp is missing', () => {
    expect(formatSessionTime(file(undefined))).toBe('session.ndjson');
  });

  it('formats a present timestamp rather than echoing the name', () => {
    expect(formatSessionTime(file(1700000000000))).not.toBe('session.ndjson');
  });
});

describe('groupSessionsByDay', () => {
  // Build timestamps from local Y/M/D so the test's notion of "same day"
  // matches the function's, independent of the runner's timezone.
  const session = (name: string, date?: Date): LogFileInfo => ({
    name,
    createdAt: date?.getTime(),
  });

  it('returns no groups for an empty archive', () => {
    expect(groupSessionsByDay([])).toEqual([]);
  });

  it('buckets sessions from the same day into one group', () => {
    const groups = groupSessionsByDay([
      session('a', new Date(2026, 5, 18, 14)),
      session('b', new Date(2026, 5, 18, 9)),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].files.map((file) => file.name)).toEqual(['a', 'b']);
    expect(groups[0].label).toEqual(expect.stringContaining('2026'));
  });

  it('splits distinct days into separate groups, preserving order', () => {
    const groups = groupSessionsByDay([
      session('newest', new Date(2026, 5, 18, 14)),
      session('middle', new Date(2026, 5, 18, 9)),
      session('oldest', new Date(2026, 5, 17, 23)),
    ]);

    expect(groups.map((day) => day.files.map((file) => file.name))).toEqual([
      ['newest', 'middle'],
      ['oldest'],
    ]);
    expect(groups[0].key).not.toBe(groups[1].key);
  });

  it('collects undated sessions into a trailing, unlabeled group', () => {
    const groups = groupSessionsByDay([
      session('dated', new Date(2026, 5, 18, 14)),
      session('legacy.ndjson'),
    ]);

    const undated = groups.at(-1);
    expect(undated?.key).toBe('undated');
    expect(undated?.label).toBeUndefined();
    expect(undated?.files.map((file) => file.name)).toEqual(['legacy.ndjson']);
  });
});
