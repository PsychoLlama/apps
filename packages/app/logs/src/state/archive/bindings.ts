import { defineAction, defineEffect } from '@lib/state';
import { byNewest, listLogFiles, type LogFileInfo } from '../../log-archive';
import { logArchiveStore } from './store';

/** Enter the loading state ahead of an enumeration so the UI can show progress. */
export const markLoading = defineAction([logArchiveStore], (state) => {
  state.status = 'loading';
});

/** Commit a resolved enumeration and mark the archive ready. */
export const setFiles = defineAction(
  [logArchiveStore],
  (state, files: ReadonlyArray<LogFileInfo>) => {
    // Merge, don't replace: an announcement can land between the enumeration's
    // snapshot and this commit (see {@link addFile}). Keep any live-added file
    // the snapshot predates so it isn't clobbered back out of the listing.
    const enumerated = new Set(files.map((file) => file.name));
    const live = state.files.filter((file) => !enumerated.has(file.name));
    state.files = [...files, ...live].sort(byNewest);
    state.status = 'ready';
  },
);

/**
 * Splice a single newly-announced log file into the listing, newest-first —
 * the live counterpart to {@link setFiles}, for a file a viewer learns about
 * after its enumeration (another tab's, or this session's own once its worker
 * finally opens it). A no-op if the file is already listed, so a re-enumeration
 * and an announcement can't double a row.
 */
export const addFile = defineAction(
  [logArchiveStore],
  (state, file: LogFileInfo) => {
    if (state.files.some((existing) => existing.name === file.name)) return;
    state.files = [...state.files, file].sort(byNewest);
  },
);

/** Surface a failed enumeration without clobbering any previously loaded list. */
export const markError = defineAction([logArchiveStore], (state) => {
  state.status = 'error';
});

/** Read the OPFS log directory and fold the result into the archive store. */
export const loadLogFilesEffect = defineEffect([], listLogFiles, {
  onStart: markLoading,
  onSuccess: setFiles,
  onFailure: markError,
});
