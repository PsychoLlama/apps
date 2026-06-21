import { createStore, defineStore, type Ref } from '@lib/state';

/**
 * Where a single session file's read is in its lifecycle. The page resolves the
 * file lazily on the client (OPFS is unreachable during prerender), so the UI
 * needs an explicit loading state. `not-found` is kept distinct from `error` so
 * a missing file reads differently from a genuine read failure.
 */
export type LogFileStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'not-found'
  | 'error';

/**
 * State backing a single session's page — the resolved OPFS file and a URL to
 * download it by. The download link is the first consumer; more of the page is
 * expected to read the handle as the viewer itself comes together.
 */
export interface LogFileState {
  /** Lifecycle of the most recent file read. */
  status: LogFileStatus;

  /**
   * The resolved OPFS file, held as an opaque ref so the store doesn't proxy
   * the host object. `null` until a read resolves.
   */
  file: Ref<File> | null;

  /**
   * Object URL minted from {@link file}, backing the download link. `null`
   * until a read resolves; the page revokes it as it tears the read down.
   */
  downloadUrl: string | null;
}

export const logFileStore = defineStore<LogFileState>(() => ({
  status: 'idle',
  file: null,
  downloadUrl: null,
}));

/** Live, readonly view of the current session file. */
export const logFile = createStore(logFileStore);
