import type { LogFileInfo } from '@lib/observability';

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'medium',
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
