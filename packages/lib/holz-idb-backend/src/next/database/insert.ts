import type { Log } from '@holz/core';

import { promisifyTransaction } from './promise';

/**
 * Write a batch of logs in a single transaction, then discard the oldest
 * until at most `retain` remain. Resolves once it commits.
 */
export const insert = async (
  database: IDBDatabase,
  table: string,
  logs: Log[],
  retain: number,
): Promise<void> => {
  const transaction = database.transaction(table, 'readwrite', {
    // Minor perf: flush on the OS's schedule. Don't force fsync.
    durability: 'relaxed',
  });

  const store = transaction.objectStore(table);

  // TODO: `add` throws on logs it can't clone. Save every log we can, and
  // report the ones we can't through `onError`.
  const last = logs.map((log) => store.add(log)).at(-1);

  // Keys auto-increment, so the newest `retain` logs sit at or above
  // `lastKey - retain + 1`. Gaps in the keys (e.g. rows deleted by hand) only
  // ever leave fewer than `retain`, never more.
  if (last) {
    last.onsuccess = () => {
      const lastKey = last.result as number;
      store.delete(IDBKeyRange.upperBound(lastKey - retain));
    };
  }

  await promisifyTransaction(transaction);
};
