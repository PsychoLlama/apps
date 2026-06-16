import { defineAction, defineEffect } from '@lib/state';
import { listLogFiles, type LogFileInfo } from '@lib/observability';
import { logArchiveStore } from './store';

/** Enter the loading state ahead of an enumeration so the UI can show progress. */
export const markLoading = defineAction([logArchiveStore], (state) => {
  state.status = 'loading';
});

/** Commit a resolved enumeration and mark the archive ready. */
export const setFiles = defineAction(
  [logArchiveStore],
  (state, files: ReadonlyArray<LogFileInfo>) => {
    state.files = files;
    state.status = 'ready';
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
