import { createStore, defineStore } from '@lib/state';
import type { Log } from '@lib/observability';

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
  /** Persisted logs in event-time order. Empty until a read resolves. */
  entries: Log[];
}

export const logsStore = defineStore<LogsState>(() => ({
  status: 'loading',
  entries: [],
}));

/** Live, readonly view of the on-device log archive. */
export const logs = createStore(logsStore);
