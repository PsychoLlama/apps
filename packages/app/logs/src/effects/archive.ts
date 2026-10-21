import { collect, pipe, resource } from '@lib/effects';
import type { Log } from '@lib/observability';
import {
  PRUNE_RECORD_KEY,
  PRUNE_STORE_NAME,
  STORE_NAME,
  TIMESTAMP_INDEX,
  openLogDatabase,
  type LogConnection,
  type PruneRecord,
} from '@lib/holz-idb-backend/database';
import { createLogInsertedChannel } from '@lib/holz-idb-backend/broadcast';
import {
  $archive,
  $archiveLoaded,
  $archiveRefreshed,
  $logsInserted,
} from '../state';

// Walks the timestamp index back-to-front, so chronology falls out of the
// iteration order. The index (not the insertion key) is what recovers true
// event-time order across interleaved producers. A `range` reads a window.
const readNewestFirst = async (
  db: LogConnection,
  range: IDBKeyRange | null = null,
): Promise<Log[]> => {
  const entries: Log[] = [];
  const index = db.transaction(STORE_NAME).store.index(TIMESTAMP_INDEX);

  for await (const cursor of index.iterate(range, 'prev')) {
    entries.push(cursor.value);
  }

  return entries;
};

// A viewer opens at whatever version exists, which can predate the pruning
// store. Naming a missing store throws, so it reads as never pruned.
const readPruneRecord = async (
  db: LogConnection,
): Promise<PruneRecord | null> => {
  if (!db.objectStoreNames.contains(PRUNE_STORE_NAME)) return null;
  return (await db.get(PRUNE_STORE_NAME, PRUNE_RECORD_KEY)) ?? null;
};

/**
 * The viewer's own connection to the IndexedDB archive, held open while
 * any view holds it so a refresh reads through it instead of reopening.
 * Opens at whatever version exists: the writing backend owns the schema.
 */
export const $connection = pipe([
  async () => {
    const db = await openLogDatabase();
    return resource(db, () => db.close());
  },
]);

/**
 * The archive store, once it holds a read, kept honest for as long as it's
 * held: every later insert ping flags it stale. Client-only, since
 * IndexedDB and `BroadcastChannel` don't exist during SSG.
 *
 * Subscribes before reading, so a ping landing mid-read isn't lost. It's
 * replayed once the snapshot lands, where it flags the view stale instead
 * of hitting the `initial` state that ignores it.
 */
export const $trackedArchive = collect(
  [$connection, $archive, $archiveLoaded, $logsInserted],
  async (db, archive, archiveLoaded, logsInserted) => {
    let loaded = false;
    let missed = false;
    const channel = createLogInsertedChannel();
    channel.onMessage(() => {
      if (loaded) logsInserted();
      else missed = true;
    });

    try {
      const [entries, pruned] = await Promise.all([
        readNewestFirst(db),
        readPruneRecord(db),
      ]);

      archiveLoaded(entries, pruned);
      loaded = true;
      if (missed) logsInserted();
    } catch (error) {
      channel.close();
      throw error;
    }

    return resource(archive, () => channel.close());
  },
);

/**
 * Pull the logs added since the snapshot and land them ahead of it, through
 * the connection the view already holds. Reads forward from the newest
 * entry shown, exclusively: a log back-dated below it won't surface until a
 * later refresh, an acceptable gap against duplicate boundary entries. An
 * empty snapshot has no floor, so it reads everything.
 */
export const $refreshArchive = collect(
  [$connection, $archive, $archiveRefreshed],
  (db, archive, archiveRefreshed) => async () => {
    // Newest-first, so the head carries the highest timestamp seen.
    const newest = archive.entries[0]?.timestamp;
    const range =
      newest === undefined ? null : IDBKeyRange.lowerBound(newest, true);

    archiveRefreshed(await readNewestFirst(db, range));
  },
);
