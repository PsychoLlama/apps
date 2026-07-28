import { watchAll } from '@lib/runtime-config';
import { createLogger, toError, type Log } from '@lib/observability';
import {
  STORE_NAME,
  TIMESTAMP_INDEX,
  openLogDatabase,
  type LogConnection,
} from '@lib/holz-idb-backend/database';
import { createLogInsertedChannel } from '@lib/holz-idb-backend/broadcast';
import type { LoadedArchive } from './archive';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Open the viewer's own connection and read the whole archive newest-first.
 * The connection is returned alongside the snapshot so the archive cell can
 * hold it open for the lifetime of the view.
 *
 * Nothing here is interruptible, so a connection that lands after the view
 * went away is closed on the spot — the commit that would have handed it to
 * the cell never runs, and nothing else would ever close it.
 */
export const loadArchive = async (
  signal: AbortSignal,
): Promise<LoadedArchive> => {
  // A reconnecting reader, never the migrator — the writing backend owns the
  // schema version, so open at whatever version currently exists.
  const db = await openLogDatabase();

  try {
    const entries = await readArchiveNewestFirst(db);
    signal.throwIfAborted();
    return { db, entries };
  } catch (error) {
    db.close();

    // An abort is ordinary teardown — the view unmounted mid-read — so it
    // isn't worth reporting as a failure.
    if (!signal.aborted) {
      logger.error('Failed to read the log archive.', {
        error: toError(error),
      });
    }

    throw error;
  }
};

/**
 * Read only the logs that landed since the viewer's snapshot, through the
 * connection it already holds rather than opening a fresh one. Backs the
 * refresh action: the whole archive is already in memory, so walk the
 * timestamp index forward from `newestShown` instead of re-reading everything.
 * A new readonly transaction sees every committed write, whichever connection
 * made it. Throws without a connection — the refresh action only fires after a
 * read has opened one, so a missing connection is a genuine fault, not an
 * empty archive to land.
 *
 * An empty snapshot has no floor to read from, so it falls back to the full
 * read. The bound is exclusive, keyed on the newest timestamp already shown: a
 * log back-dated below it — or sharing that exact millisecond — after the read
 * won't surface until a later refresh, an acceptable gap for a manual pull
 * against duplicate boundary entries.
 */
export const readNewLogs = async (
  _signal: AbortSignal,
  db: LogConnection | null,
  newestShown: number | undefined,
): Promise<Log[]> => {
  try {
    if (!db) {
      throw new Error('Cannot refresh logs: no archive connection is held.');
    }

    return newestShown === undefined
      ? await readArchiveNewestFirst(db)
      : await readArchiveNewestFirst(
          db,
          IDBKeyRange.lowerBound(newestShown, true),
        );
  } catch (error) {
    // Unlike the initial read there's already a snapshot on screen and a live
    // connection, so the viewer keeps both and only the log records this.
    logger.error('Failed to refresh the log archive.', {
      error: toError(error),
    });

    throw error;
  }
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
 * Close the archive connection, releasing it back to IndexedDB. A no-op before
 * one's been opened.
 *
 * Not signal-first, because it isn't a capability: the connection cell hands it
 * straight to its `drop` hook, so losing the last anchor is what closes the
 * connection.
 */
export const closeConnection = (db: LogConnection | null): void => {
  db?.close();
};

/**
 * Open the backend's insert channel as a buffered stream of pings. The backend
 * pings from any browsing context when it persists logs; the message carries no
 * payload, because the event itself is the whole signal — the viewer only needs
 * to know the store moved past what it last read.
 *
 * Subscribing happens here rather than at the first pull, so a ping landing
 * while the archive read is still in flight is buffered instead of lost. See
 * {@link watchAll} for the buffering and teardown guarantees the stream
 * carries.
 */
export const watchLogInserts = (signal: AbortSignal): AsyncGenerator<void> =>
  watchAll<void>(signal, (push) => {
    const channel = createLogInsertedChannel();
    channel.onMessage(() => push());
    return [() => channel.close()];
  });

/**
 * Wait for the next insert ping, resolving `true` when one lands and `false`
 * once the stream ends.
 *
 * Pulled one ping at a time rather than drained with `for await` because the
 * ping carries nothing to bind, and going through a capability keeps each pull
 * on the saga's instruction trace — abortable, and stubbable in tests.
 */
export const nextLogInsert = async (
  _signal: AbortSignal,
  inserts: AsyncGenerator<void>,
): Promise<boolean> => !(await inserts.next()).done;
