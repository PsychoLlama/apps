import { createStore, defineStore, type Ref } from '@lib/state';
import type { Log } from '@lib/observability';
import type { LogConnection } from '@lib/holz-idb-backend/database';

/**
 * Where the archive read sits.
 *
 * - `loading` — the read hasn't resolved. The site is SSG'd and IndexedDB is
 *   client-only, so this is also what prerender and first paint show; the UI
 *   renders it as a skeleton rather than a misleading empty state.
 * - `ready` — the read resolved; `entries` holds the archive (possibly empty).
 * - `error` — the read failed; `entries` stays empty.
 */
export type LogsStatus = 'loading' | 'ready' | 'error';

/** The on-device log archive, as read back from IndexedDB. */
export interface LogsState {
  /** Where the archive read sits in its lifecycle. */
  status: LogsStatus;
  /** Persisted logs, newest-first. Empty until a read resolves. */
  entries: Log[];
  /**
   * The viewer's own connection to the IndexedDB archive, held open for the
   * lifetime of the view so reads walk the live store directly instead of
   * reopening per read. `null` until the connection opens — which is also its
   * state during SSG and first paint, since IndexedDB is client-only.
   */
  db: Ref<LogConnection> | null;
}

export const logsStore = defineStore<LogsState>(() => ({
  status: 'loading',
  entries: [],
  db: null,
}));

/** Live, readonly view of the on-device log archive. */
export const logs = createStore(logsStore);
