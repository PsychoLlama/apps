import { defineAction, defineEffect, ref } from '@lib/state';
import { LOG_DIRECTORY } from '@lib/observability';
import { logFileStore } from './store';

/** Input for a single-file read: the routed file name and a cancel signal. */
interface LogFileRequest {
  /** OPFS file name to resolve, as the archive lists it. */
  name: string;

  /** Aborts the read when the page navigates away before it resolves. */
  signal: AbortSignal;
}

/** A resolved read: the OPFS file and a download URL minted from it. */
interface ResolvedLogFile {
  file: File;
  downloadUrl: string;
}

/**
 * Reset every field of the file state ahead of a read. Clearing the handle and
 * URL — not just the status — keeps a previous session's file from bleeding
 * through while the next one loads on navigation. The page revokes the outgoing
 * URL as it tears the previous read down, so the cleared URL is never leaked.
 */
export const markFileLoading = defineAction([logFileStore], (state) => {
  state.status = 'loading';
  state.file = null;
  state.downloadUrl = null;
});

/** Commit a resolved read: the file and the URL to download it by. */
export const setLogFile = defineAction(
  [logFileStore],
  (state, resolved: ResolvedLogFile) => {
    state.status = 'ready';
    state.file = ref(resolved.file);
    state.downloadUrl = resolved.downloadUrl;
  },
);

/** True for the `NotFoundError` OPFS raises when a directory or file is absent. */
const isNotFound = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'NotFoundError';

/**
 * Resolve a failed read into a status. A missing file lands its own
 * `not-found` state rather than a generic error. Aborts are ignored entirely:
 * a cancelled read was superseded by a newer navigation (or the page
 * unmounted), so its late rejection must not clobber the fresh state. Only the
 * status moves — `onStart` already cleared the file and URL, and a failed read
 * never set new ones.
 */
export const markFileError = defineAction(
  [logFileStore],
  (state, error: Error) => {
    if (error.name === 'AbortError') return;
    state.status = isNotFound(error) ? 'not-found' : 'error';
  },
);

/**
 * Resolve a session log's OPFS file and mint a download URL backed by it.
 * `getFile()` returns a `File` (a `Blob` view over the on-disk bytes), so the
 * URL streams straight to a download without reading the log into memory.
 *
 * The `signal` is checked after every await — the only points the read can
 * suspend — so a navigation can't land state on the wrong page. A missing
 * directory or file rejects with `NotFoundError`, which {@link markFileError}
 * folds into the `not-found` state.
 */
const resolveLogFile = async ({
  name,
  signal,
}: LogFileRequest): Promise<ResolvedLogFile> => {
  const root = await navigator.storage.getDirectory();
  signal.throwIfAborted();

  const dir = await root.getDirectoryHandle(LOG_DIRECTORY);
  signal.throwIfAborted();

  const handle = await dir.getFileHandle(name);
  signal.throwIfAborted();

  const file = await handle.getFile();
  signal.throwIfAborted();

  return { file, downloadUrl: URL.createObjectURL(file) };
};

/** Resolve the routed session file into the file store, cancelling on navigation. */
export const loadLogFileEffect = defineEffect([], resolveLogFile, {
  onStart: markFileLoading,
  onSuccess: setLogFile,
  onFailure: markFileError,
});
