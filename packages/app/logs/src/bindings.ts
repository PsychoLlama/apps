import { defineAction, defineEffect } from '@lib/state';
import { listActiveLogFiles } from '@lib/holz-opfs-backend';
import { listLogFiles, type LogFileInfo } from './log-archive.ts';
import { logArchiveStore } from './store';

/** A resolved enumeration: the archive listing plus which sessions are active. */
interface LogArchiveSnapshot {
  /** The persisted log files, newest first. */
  files: ReadonlyArray<LogFileInfo>;

  /**
   * Names of files whose session still holds its Web Lock, or `undefined` if
   * the lock query failed — in which case the previous set is left in place.
   */
  activeFiles: ReadonlySet<string> | undefined;
}

/** Enter the loading state ahead of an enumeration so the UI can show progress. */
export const markLoading = defineAction([logArchiveStore], (state) => {
  state.status = 'loading';
});

/** Commit a resolved enumeration and mark the archive ready. */
export const setFiles = defineAction(
  [logArchiveStore],
  (state, snapshot: LogArchiveSnapshot) => {
    state.files = snapshot.files;
    state.status = 'ready';
    if (snapshot.activeFiles) state.activeFiles = snapshot.activeFiles;
  },
);

/** Surface a failed enumeration without clobbering any previously loaded list. */
export const markError = defineAction([logArchiveStore], (state) => {
  state.status = 'error';
});

/**
 * Read the OPFS log directory and the held Web Locks, folding both into the
 * archive snapshot. The lock query is best-effort: a failure leaves the active
 * set untouched rather than failing the whole enumeration.
 */
const loadLogArchive = async (): Promise<LogArchiveSnapshot> => {
  const [files, activeFiles] = await Promise.all([
    listLogFiles(),
    listActiveLogFiles().then(
      (names) => new Set(names),
      () => undefined,
    ),
  ]);

  return { files, activeFiles };
};

/** Read the OPFS log directory and fold the result into the archive store. */
export const loadLogFilesEffect = defineEffect([], loadLogArchive, {
  onStart: markLoading,
  onSuccess: setFiles,
  onFailure: markError,
});
