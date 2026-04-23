import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Recording } from './types';

/** Persisted shape for a recording — Recording metadata plus the raw blob. */
export interface PersistedRecording {
  id: string;
  name: string;
  duration: number;
  createdAt: number;
  blob: Blob;
}

interface StudioSchema extends DBSchema {
  recordings: {
    key: string;
    value: PersistedRecording;
  };
}

const DB_NAME = 'studio';
const DB_VERSION = 1;
const STORE = 'recordings';

// Module-singleton: one open() per page, shared across every capability
// call. The IDB connection is cheap to keep around and far cheaper than
// the ceremony of opening per request.
let dbPromise: Promise<IDBPDatabase<StudioSchema>> | null = null;

const getDB = (): Promise<IDBPDatabase<StudioSchema>> => {
  dbPromise ??= openDB<StudioSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(STORE, { keyPath: 'id' });
    },
  });
  return dbPromise;
};

/** Release the browser's reference to a blob URL. */
export const revokeRecording = (url: string): void => {
  URL.revokeObjectURL(url);
};

/** Persist a finalized recording's metadata + blob to IndexedDB. */
export const persistRecording = async (
  recording: PersistedRecording,
): Promise<void> => {
  const db = await getDB();
  await db.put(STORE, recording);
};

/** Drop a persisted recording from IndexedDB. */
export const removePersistedRecording = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete(STORE, id);
};

/**
 * Read every persisted recording, mint blob URLs, and return them in
 * capture order. Callers are responsible for revoking those URLs when
 * the recordings are dropped.
 */
export const loadRecordings = async (): Promise<Recording[]> => {
  const db = await getDB();
  const persisted = await db.getAll(STORE);
  return persisted
    .sort((left, right) => left.createdAt - right.createdAt)
    .map(({ blob, ...meta }) => ({
      ...meta,
      url: URL.createObjectURL(blob),
    }));
};
