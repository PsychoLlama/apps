import type { Log } from '@holz/core';

import { promisifyTransaction } from './promise';

/** Write a batch of logs in a single transaction, resolving once it commits. */
export const insert = async (
  database: IDBDatabase,
  table: string,
  logs: Log[],
): Promise<void> => {
  const transaction = database.transaction(table, 'readwrite', {
    // Minor perf: flush on the OS's schedule. Don't force fsync.
    durability: 'relaxed',
  });

  const store = transaction.objectStore(table);

  // TODO: `add` throws on logs it can't clone. Save every log we can, and
  // report the ones we can't through `onError`.
  logs.forEach((log) => store.add(log));

  await promisifyTransaction(transaction);
};
