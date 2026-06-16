import { LOG_DIRECTORY } from './log-file.ts';

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
    files.push({
      name: handle.name,
      createdAt: parseCreatedAt(handle.name),
    });
  }

  // Newest first by encoded start time; names without a timestamp sink last.
  return files.sort(
    (left, right) => (right.createdAt ?? 0) - (left.createdAt ?? 0),
  );
};
