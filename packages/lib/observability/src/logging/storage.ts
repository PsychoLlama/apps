import type { DatabaseConfig } from '@lib/holz-idb-backend/next';
import { deleteDatabase } from '@lib/holz-idb-backend/next/database';

// Where browser logs are persisted. Matches the old backend's layout, so
// existing archives carry over.
export const LOGS_DATABASE: DatabaseConfig = {
  name: '@holz',
  table: 'logs',
};

// Index over `timestamp`. Several realms write to the store, and buffered logs
// can land after newer ones, so readers sort by this rather than insertion.
export const TIMESTAMP_INDEX = 'by-timestamp';

/**
 * Delete every log persisted on this origin. Waits for open connections to
 * close; backends recreate the database on their next write.
 */
export const deleteLogsDatabase = (): Promise<void> =>
  deleteDatabase(LOGS_DATABASE.name);
