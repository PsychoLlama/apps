import type { LogFileInfo } from '@lib/observability';
import { formatBytes, formatSessionLabel, formatSessionTime } from '../format';

describe('formatBytes', () => {
  it('keeps small counts in bytes with no decimal', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(824)).toBe('824 B');
  });

  it('promotes to the largest unit under four digits', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
  });

  it('rounds to a single decimal place', () => {
    expect(formatBytes(1024 * 1.27)).toBe('1.3 KB');
  });
});

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
    size: 0,
    createdAt,
  });

  it('falls back to the file name when the timestamp is missing', () => {
    expect(formatSessionTime(file(undefined))).toBe('session.ndjson');
  });

  it('formats a present timestamp rather than echoing the name', () => {
    expect(formatSessionTime(file(1700000000000))).not.toBe('session.ndjson');
  });
});
