import type { LogFileInfo } from '@lib/observability';

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'medium',
});

const dayHeadingFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'full',
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

/** A day's worth of session logs, for the archive index's per-day sections. */
export interface SessionDay {
  /** Stable key for keyed rendering — the day's start epoch, or `'undated'`. */
  key: string;

  /**
   * Localized day heading (e.g. "Thursday, June 18, 2026"), or `undefined` for
   * sessions whose name predates the timestamp scheme and has no day to anchor.
   */
  label: string | undefined;

  /** Sessions that began on this day, preserving the input's newest-first order. */
  files: ReadonlyArray<LogFileInfo>;
}

/** Collapse a timestamp to its local midnight, the key sessions group by. */
const startOfDay = (epochMs: number): number => {
  const date = new Date(epochMs);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

/**
 * Bucket session logs into per-day groups for the archive index. Input is
 * assumed newest-first (as the archive enumeration returns it); the day groups
 * and the sessions within each one preserve that order. Sessions with no
 * parseable timestamp collect into a final, unlabeled group.
 */
export const groupSessionsByDay = (
  files: ReadonlyArray<LogFileInfo>,
): ReadonlyArray<SessionDay> => {
  const days = new Map<number, LogFileInfo[]>();
  const undated: LogFileInfo[] = [];

  for (const file of files) {
    if (file.createdAt === undefined) {
      undated.push(file);
      continue;
    }

    const key = startOfDay(file.createdAt);
    const bucket = days.get(key);
    if (bucket) bucket.push(file);
    else days.set(key, [file]);
  }

  const groups: SessionDay[] = [];
  for (const [key, dayFiles] of days) {
    groups.push({
      key: String(key),
      label: dayHeadingFormat.format(key),
      files: dayFiles,
    });
  }

  if (undated.length > 0) {
    groups.push({ key: 'undated', label: undefined, files: undated });
  }

  return groups;
};
