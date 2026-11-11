import { collect } from '@lib/effects';
import {
  PRUNE_RECORD_KEY,
  PRUNE_STORE_NAME,
  STORE_NAME,
  TIMESTAMP_INDEX,
  openLogDatabase,
  type LogConnection,
  type PruneRecord,
} from '@lib/holz-idb-backend/database';
import { $archive, $archiveLoaded, type ArchivedLog } from '../state';

// Walks the timestamp index back-to-front, so chronology falls out of the
// iteration order. The index (not the insertion key) is what recovers true
// event-time order across interleaved producers.
const readNewestFirst = async (db: LogConnection): Promise<ArchivedLog[]> => {
  const entries: ArchivedLog[] = [];
  const index = db.transaction(STORE_NAME).store.index(TIMESTAMP_INDEX);

  for await (const cursor of index.iterate(null, 'prev')) {
    entries.push({ ...cursor.value, id: cursor.primaryKey });
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
 * The archive, read once from IndexedDB when first held. Client-only, since
 * IndexedDB doesn't exist during SSG. Opens at whatever version exists: the
 * writing backend owns the schema.
 */
export const $trackedArchive = collect(
  [$archive, $archiveLoaded],
  async (archive, archiveLoaded) => {
    const db = await openLogDatabase();

    try {
      const [entries, pruned] = await Promise.all([
        readNewestFirst(db),
        readPruneRecord(db),
      ]);

      archiveLoaded(entries, pruned);
    } finally {
      db.close();
    }

    return archive;
  },
);
