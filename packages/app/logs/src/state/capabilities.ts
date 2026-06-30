import type { DeepReadonly } from '@lib/state';
import type { Log } from '@lib/observability';
import {
  STORE_NAME,
  TIMESTAMP_INDEX,
  openLogDatabase,
  type LogConnection,
} from '@lib/holz-idb-backend/database';
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
 * Walk the timestamp index back-to-front with a `'prev'` cursor, so chronology
 * falls out of the iteration order — newest-first — rather than a post-hoc
 * reverse over a fully materialized array. The index (not the insertion key)
 * is what recovers true event-time order across interleaved producers.
 */
const readArchiveNewestFirst = async (db: LogConnection): Promise<Log[]> => {
  const entries: Log[] = [];
  const index = db.transaction(STORE_NAME).store.index(TIMESTAMP_INDEX);

  for (
    let cursor = await index.openCursor(null, 'prev');
    cursor;
    cursor = await cursor.continue()
  ) {
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
