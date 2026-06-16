import type { LogFileInfo } from '@lib/observability';
import { formatSessionLabel, formatSessionTime } from '../format';

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
