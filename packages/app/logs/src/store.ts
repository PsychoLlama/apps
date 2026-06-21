import { createStore, defineStore } from '@lib/state';
import type { LogFileInfo } from './log-archive.ts';

/**
 * Where the OPFS enumeration is in its lifecycle. The list is read lazily on
 * the client (OPFS is unreachable during prerender), so the UI needs an
 * explicit loading state rather than assuming data is ready on first paint.
 */
export type ArchiveStatus = 'idle' | 'loading' | 'ready' | 'error';

/** State backing the log viewer — the enumerated archive and its load status. */
export interface LogArchiveState {
  /** Lifecycle of the most recent enumeration. */
  status: ArchiveStatus;

  /** The persisted log files, newest first. Empty until a read resolves. */
  files: ReadonlyArray<LogFileInfo>;

  /**
   * Names of log files whose owning session is currently active — it still
   * holds the session's Web Lock. Intersected with {@link files} to badge rows.
   */
  activeFiles: ReadonlySet<string>;
}

export const logArchiveStore = defineStore<LogArchiveState>(() => ({
  status: 'idle',
  files: [],
  activeFiles: new Set(),
}));

/** Live, readonly view of the log archive state. */
export const logArchive = createStore(logArchiveStore);
