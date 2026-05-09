import { openDB, type IDBPDatabase } from 'idb';

/**
 * IndexedDB-backed memory of the most-recently-picked root handle.
 * `FileSystemHandle` is structured-cloneable, so the handle survives
 * across reloads. Permission state is *not* persisted by the browser
 * — call `queryPermission` on the restored handle to learn whether
 * we still have read access or need to prompt the user again.
 */

const DB_NAME = 'file-browser';
const STORE = 'handles';
const KEY = 'last-root';
const SCHEMA_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | undefined;

const getDb = (): Promise<IDBPDatabase> => {
  dbPromise ??= openDB(DB_NAME, SCHEMA_VERSION, {
    upgrade(db) {
      db.createObjectStore(STORE);
    },
  });
  return dbPromise;
};

/** Persist the picked root for next session. Idempotent overwrite. */
export const stashRootHandle = async (
  handle: FileSystemDirectoryHandle,
): Promise<void> => {
  const db = await getDb();
  await db.put(STORE, handle, KEY);
};

/** Pull the previously-stashed handle, or `undefined` on a fresh device. */
export const loadRootHandle = async (): Promise<
  FileSystemDirectoryHandle | undefined
> => {
  const db = await getDb();
  const handle: unknown = await db.get(STORE, KEY);
  return (handle as FileSystemDirectoryHandle | undefined) ?? undefined;
};

/** Forget the stashed handle. Used when the OS revokes permission. */
export const clearRootHandle = async (): Promise<void> => {
  const db = await getDb();
  await db.delete(STORE, KEY);
};
