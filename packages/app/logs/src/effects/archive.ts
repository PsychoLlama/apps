import { pipe } from '@lib/effects';
import { openDatabase } from '@lib/holz-idb-backend/database';
import type { Log } from '@lib/observability';
import { LOGS_DATABASE, TIMESTAMP_INDEX } from '@lib/observability/storage';
import { wrap } from 'idb';

/** A persisted log, tagged with the key IndexedDB stores it under. */
export interface ArchivedLog extends Log {
  /** The log's IndexedDB key. Unique, so it names the entry across reads. */
  id: number;
}

/**
 * Every persisted log, newest-first, read once from IndexedDB when first held.
 * Client-only, since IndexedDB doesn't exist during SSG.
 */
export const $archivedLogs = pipe([
  async (): Promise<ArchivedLog[]> => {
    const db = wrap(await openDatabase(LOGS_DATABASE));

    try {
      const entries: ArchivedLog[] = [];
      const index = db
        .transaction(LOGS_DATABASE.table)
        .store.index(TIMESTAMP_INDEX);

      // Back-to-front, so chronology falls out of the iteration order. The
      // index (not the insertion key) is what recovers true event-time order
      // across interleaved producers.
      for await (const cursor of index.iterate(null, 'prev')) {
        entries.push({
          ...(cursor.value as Log),
          id: cursor.primaryKey as number,
        });
      }

      return entries;
    } finally {
      db.close();
    }
  },
]);
