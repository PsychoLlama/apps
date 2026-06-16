import type { LogFileInfo } from '@lib/observability';

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/** Recover the `Date.now()` prefix a log file name is minted with, if present. */
const parseCreatedAt = (name: string): number | undefined => {
  const prefix = Number.parseInt(name, 10);
  return Number.isNaN(prefix) ? undefined : prefix;
};

/**
 * Label a log file by when its session began. Falls back to the raw file name
 * for the rare entry whose name carries no parseable timestamp.
 */
export const formatSessionTime = (file: LogFileInfo): string =>
  file.createdAt === undefined
    ? file.name
    : dateTimeFormat.format(file.createdAt);

/**
 * Same session label as {@link formatSessionTime}, derived from a bare file
 * name — for the session page, which only has the routed name to work from.
 */
export const formatSessionLabel = (name: string): string => {
  const createdAt = parseCreatedAt(name);
  return createdAt === undefined ? name : dateTimeFormat.format(createdAt);
};

const UNITS = ['B', 'KB', 'MB', 'GB'] as const;

/**
 * Render a byte count in the largest unit that keeps it under four digits,
 * e.g. `824 B`, `4.2 KB`, `1.3 MB`. Whole units drop the decimal.
 */
export const formatBytes = (bytes: number): string => {
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < UNITS.length - 1) {
    size /= 1024;
    unit += 1;
  }
  const rounded = unit === 0 ? size : Math.round(size * 10) / 10;
  return `${rounded} ${UNITS[unit]}`;
};
