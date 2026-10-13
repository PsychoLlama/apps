import { PRUNE_STORE_NAME, STORE_NAME, connectToLogDatabase } from './database';

/**
 * Delete every persisted log, along with the prune record. For a user wiping
 * the archive on purpose: what's left is indistinguishable from a fresh one,
 * so there's no gap left to record.
 *
 * Clears the stores rather than deleting the database, which would block for
 * as long as any context's backend held its connection open.
 */
export const clearLogs = async (): Promise<void> => {
  const db = await connectToLogDatabase();

  try {
    const tx = db.transaction([STORE_NAME, PRUNE_STORE_NAME], 'readwrite');
    await Promise.all([
      tx.objectStore(STORE_NAME).clear(),
      tx.objectStore(PRUNE_STORE_NAME).clear(),
      tx.done,
    ]);
  } finally {
    db.close();
  }
};
