import { LOG_DIRECTORY } from '@lib/observability';

/**
 * Metadata for one persisted session log file in the OPFS log directory —
 * enough to list it without reading its contents.
 */
export interface LogFileInfo {
  /**
   * File name within the log directory. Doubles as the OPFS key and the
   * stable identifier a viewer routes by — compare against {@link
   * LOG_FILE_NAME} to spot the current session's file.
   */
  name: string;

  /**
   * When the owning session began, in epoch milliseconds — read from the
   * `Date.now()` prefix every name is minted with (see {@link LOG_FILE_NAME}).
   * `undefined` for a name that predates that scheme.
   */
  createdAt: number | undefined;
}

/**
 * Recover the creation timestamp encoded in a log file name's leading
 * `Date.now()` prefix. Returns `undefined` when the name doesn't start with
 * digits, so an unrecognized name degrades to "no timestamp" rather than `NaN`.
 */
const parseCreatedAt = (name: string): number | undefined => {
  const prefix = Number.parseInt(name, 10);
  return Number.isNaN(prefix) ? undefined : prefix;
};

/**
 * Build the {@link LogFileInfo} for a bare file name — the listing's per-entry
 * shape, derived without opening the file. Shared by the directory enumeration
 * and the live broadcast path, so a row added either way carries identical
 * metadata.
 */
export const describeLogFile = (name: string): LogFileInfo => ({
  name,
  createdAt: parseCreatedAt(name),
});

/** Order {@link LogFileInfo}s newest first; names without a timestamp sink last. */
export const byNewest = (left: LogFileInfo, right: LogFileInfo): number =>
  (right.createdAt ?? 0) - (left.createdAt ?? 0);

/**
 * List the session log files the observability worker has persisted to the
 * OPFS log directory, newest first. Reads names only — no file is opened — so
 * it stays cheap regardless of how much each session logged.
 *
 * Browser main thread only: it resolves entries through `navigator.storage`,
 * which workers expose too, but the codebase only ever lists from the UI. The
 * directory is opened with `create: true`, so a device that has never logged
 * (no directory yet) reads as empty instead of throwing.
 */
export const listLogFiles = async (): Promise<LogFileInfo[]> => {
  const root = await navigator.storage.getDirectory();
  const dir = await root.getDirectoryHandle(LOG_DIRECTORY, { create: true });

  const files: LogFileInfo[] = [];
  for await (const handle of dir.values()) {
    if (handle.kind !== 'file') continue;
    files.push(describeLogFile(handle.name));
  }

  // Newest first by encoded start time; names without a timestamp sink last.
  return files.sort(byNewest);
};

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'medium',
});

const timeFormat = new Intl.DateTimeFormat(undefined, {
  timeStyle: 'medium',
});

const dayHeadingFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'full',
});

/**
 * Label a log file by the time of day its session began — the archive index
 * groups rows under a date heading, so the row itself only needs the time.
 * Falls back to the raw file name for the rare entry whose name carries no
 * parseable timestamp.
 */
export const formatSessionTime = (file: LogFileInfo): string =>
  file.createdAt === undefined ? file.name : timeFormat.format(file.createdAt);

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
