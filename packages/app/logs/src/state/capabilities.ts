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
 * Read only the logs that landed since the viewer's snapshot, through the
 * connection it already holds rather than opening a fresh one. Backs the
 * refresh action: the whole archive is already in memory, so walk the timestamp
 * index forward from the newest entry held instead of re-reading everything. A
 * new readonly transaction sees every committed write, whichever connection
 * made it. Throws if no connection is held — the refresh action only fires
 * after a read has opened one, so a missing connection is a genuine fault, not
 * an empty archive to land.
 *
 * An empty snapshot has no floor to read from, so fall back to the full read.
 * The bound is exclusive, keyed on the newest timestamp already shown: a log
 * back-dated below it — or sharing that exact millisecond — after the read
 * won't surface until a later refresh, an acceptable gap for a manual pull
 * against duplicate boundary entries.
 */
export const readNewLogs = async (
  state: DeepReadonly<LogsState>,
): Promise<Log[]> => {
  const db = state.db?.current;
  if (!db) {
    throw new Error('Cannot refresh logs: no archive connection is held.');
  }

  // `entries` is newest-first, so the head carries the highest timestamp seen.
  const newestShown = state.entries[0]?.timestamp;
  return newestShown === undefined
    ? readArchiveNewestFirst(db)
    : readArchiveNewestFirst(db, IDBKeyRange.lowerBound(newestShown, true));
};

/**
 * Walk the timestamp index back-to-front with a `'prev'` cursor, so chronology
 * falls out of the iteration order — newest-first — rather than a post-hoc
 * reverse over a fully materialized array. The index (not the insertion key)
 * is what recovers true event-time order across interleaved producers. Pass a
 * `range` to read a window — a refresh walks just the newer tail.
 */
const readArchiveNewestFirst = async (
  db: LogConnection,
  range: IDBKeyRange | null = null,
): Promise<Log[]> => {
  const entries: Log[] = [];
  const index = db.transaction(STORE_NAME).store.index(TIMESTAMP_INDEX);

  // `idb` makes a cursor async-iterable, advancing it each turn — so the
  // `'prev'` direction is all that's needed to drain the index newest-first.
  for await (const cursor of index.iterate(range, 'prev')) {
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
