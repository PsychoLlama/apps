/** Applies schema changes when a database is created or moves to a new version. */
export type Upgrade = (database: IDBDatabase, oldVersion: number) => void;

/**
 * Promise wrapper over `indexedDB.open`. Rejects if the open fails, `upgrade`
 * throws, or the database is already past `version`.
 */
export const open = (
  name: string,
  version: number,
  upgrade: Upgrade,
): Promise<IDBDatabase> => {
  const request = indexedDB.open(name, version);

  request.onupgradeneeded = (event) => {
    upgrade(request.result, event.oldVersion);
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
