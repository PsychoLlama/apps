import { pipe } from '@lib/effects';
import {
  STORE_NAME,
  TIMESTAMP_INDEX,
  openLogDatabase,
  type LogConnection,
} from '@lib/holz-idb-backend/database';
import type { Log } from '@lib/observability';

/** A persisted log, tagged with the key IndexedDB stores it under. */
export interface ArchivedLog extends Log {
  /** The log's IndexedDB key. Unique, so it names the entry across reads. */
  id: number;
}

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
 * Every persisted log, newest-first, read once from IndexedDB when first held.
 * Client-only, since IndexedDB doesn't exist during SSG. Opens at whatever
 * version exists: the writing backend owns the schema.
 */
export const $archivedLogs = pipe([
  async () => {
    const db = await openLogDatabase();

    try {
      return await readNewestFirst(db);
    } finally {
      db.close();
    }
  },
]);
