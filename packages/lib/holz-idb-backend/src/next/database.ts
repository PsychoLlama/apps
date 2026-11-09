import type { Migration } from './migrations';

/**
 * Open a database at the version implied by `migrations`, applying any it
 * hasn't seen. Rejects if the open fails, a migration throws, or the database
 * is already past that version.
 */
export const open = (
  name: string,
  migrations: Migration[],
): Promise<IDBDatabase> => {
  const request = indexedDB.open(name, migrations.length);

  request.onupgradeneeded = (event) => {
    migrations
      .slice(event.oldVersion)
      .forEach((runMigration) => runMigration(request.result));
  };

  return promisifyRequest(request);
};

/** Resolves with the request's result, or rejects with its error. */
const promisifyRequest = <T>(request: IDBRequest<T>): Promise<T> => {
  const { promise, resolve, reject } = Promise.withResolvers<T>();

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => {
    const error =
      request.error ??
      new Error('IndexedDB request failed.', { cause: request });

    reject(error);
  };

  return promise;
};
