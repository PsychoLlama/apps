import { defineDatabase, type Migration } from '@lib/holz-idb-backend';

/**
 * Index over `timestamp` in the logs table. Several realms write to it, and
 * buffered logs can land after newer ones, so sort by this rather than
 * insertion order.
 */
export const TIMESTAMP_INDEX = 'by-timestamp';

/**
 * Where browser logs are persisted. Pass to the utilities in
 * `@lib/holz-idb-backend/database` (`openDatabase`, `deleteDatabase`)
 * to read or clear them.
 */
export const LOGS_DATABASE = defineDatabase('@holz', 'logs', (migrations) => {
  // Matches the old backend's layout, so existing archives carry over. It
  // shipped v1 (store + timestamp index) and v2 (`pruning`). Keep its version
  // numbers, then converge every database in v3: fresh ones gain the index,
  // old ones lose `pruning`.
  return migrations.flatMap<Migration>((migration) => {
    if (migration.name !== 'init') return migration;

    return [
      migration,

      // Old code maintained a `pruning` table. No longer needed.
      // Placeholder migration for the derived IDB version.
      { name: 'legacy-pruning', run: () => {} },

      {
        name: 'reconcile',
        run: (transaction) => {
          // Old code created the ts index as part of the backend.
          // Now it's owned by the application (us).
          const logs = transaction.objectStore(LOGS_DATABASE.table);
          if (!logs.indexNames.contains(TIMESTAMP_INDEX)) {
            logs.createIndex(TIMESTAMP_INDEX, 'timestamp');
          }

          // Leftover from a manual log pruning behavior.
          if (transaction.db.objectStoreNames.contains('pruning')) {
            transaction.db.deleteObjectStore('pruning');
          }
        },
      },
    ];
  });
});
