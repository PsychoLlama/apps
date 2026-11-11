import { collect } from '@lib/effects';
import {
  STORE_NAME,
  TIMESTAMP_INDEX,
  openLogDatabase,
  type LogConnection,
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
      archiveLoaded(await readNewestFirst(db));
    } finally {
      db.close();
    }

    return archive;
  },
);
