import type { DeepReadonly } from '@lib/state';
import type { Log } from '@lib/observability';
import {
  STORE_NAME,
  TIMESTAMP_INDEX,
  openLogDatabase,
  type LogConnection,
} from '@lib/holz-idb-backend/database';
import { onLogInserted } from '@lib/holz-idb-backend/broadcast';
import type { LogsState } from './store';

/** A freshly read snapshot together with the connection it was read through. */
export interface LoadedArchive {
  /** The opened connection, handed to the store to hold and later close. */
  db: LogConnection;
  /** The archive contents, newest-first. */
  entries: Log[];
}

/**
 * Open the viewer's own connection and read the whole archive newest-first.
 * The connection is returned alongside the snapshot so the store can hold it
 * open for the lifetime of the view; on a failed read it's closed here, since
 * nothing downstream gets a chance to.
 */
export const loadArchive = async (): Promise<LoadedArchive> => {
  // A reconnecting reader, never the migrator — the writing backend owns the
  // schema version, so open at whatever version currently exists.
  const db = await openLogDatabase();
  try {
    return { db, entries: await readArchiveNewestFirst(db) };
  } catch (error) {
    db.close();
    throw error;
  }
};

/**
 * Re-read the archive through the connection the viewer already holds, rather
 * than opening a fresh one. Backs the refresh action: the backend pinged that
 * new logs landed, so walk the live store again for the current snapshot. A new
 * readonly transaction sees every committed write, whichever connection made
 * it. Throws if no connection is held — the refresh action only fires after a
 * read has opened one, so a missing connection is a genuine fault, not an
 * empty archive to land.
 */
export const reloadArchive = async (
  state: DeepReadonly<LogsState>,
): Promise<Log[]> => {
  const db = state.db?.current;
  if (!db) {
    throw new Error('Cannot refresh logs: no archive connection is held.');
  }

  return readArchiveNewestFirst(db);
};

/**
 * Ping the caller whenever the backend persists new logs, from any context
 * (this tab, a worker, the service worker). Returns an unsubscribe. The viewer
 * flips to stale on the first ping; it re-reads on its own terms, so the ping
 * carries no payload.
 */
export const watchLogInserts = (onInsert: () => void): (() => void) =>
  onLogInserted(onInsert);

/**
 * Walk the timestamp index back-to-front with a `'prev'` cursor, so chronology
 * falls out of the iteration order — newest-first — rather than a post-hoc
 * reverse over a fully materialized array. The index (not the insertion key)
 * is what recovers true event-time order across interleaved producers.
 */
const readArchiveNewestFirst = async (db: LogConnection): Promise<Log[]> => {
  const entries: Log[] = [];
  const index = db.transaction(STORE_NAME).store.index(TIMESTAMP_INDEX);

  // `idb` makes a cursor async-iterable, advancing it each turn — so the
  // `'prev'` direction is all that's needed to drain the index newest-first.
  for await (const cursor of index.iterate(null, 'prev')) {
    entries.push(cursor.value);
  }

  return entries;
};

/**
 * Close the held connection straight off the store view, releasing it back to
 * IndexedDB. A no-op before one's been opened.
 */
export const closeArchive = (state: DeepReadonly<LogsState>): void => {
  state.db?.current.close();
};
