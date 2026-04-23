import type { DeepReadonly } from '@lib/state';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { LibraryState } from './store';
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
// the ceremony of opening per request. The cached promise self-evicts
// on rejection so a transient failure (storage briefly blocked, etc.)
// doesn't poison every later persist/load for the lifetime of the page.
let dbPromise: Promise<IDBPDatabase<StudioSchema>> | null = null;

const getDB = (): Promise<IDBPDatabase<StudioSchema>> => {
  if (dbPromise) return dbPromise;
  const promise = openDB<StudioSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(STORE, { keyPath: 'id' });
    },
  });
  dbPromise = promise;
  void promise.catch(() => {
    if (dbPromise === promise) dbPromise = null;
  });
  return promise;
};

// Dedupe concurrent reads at the IDB layer so two hydrates kicked off
// by overlapping route mounts share fate — one can't fail while the
// other succeeds and gets dropped by the action's `loaded` guard.
// URL.createObjectURL still runs per call so the duplicate filter in
// `loadRecordingsEffect` can revoke its own URLs without aliasing.
let persistedFetch: Promise<PersistedRecording[]> | null = null;

const fetchPersisted = (): Promise<PersistedRecording[]> => {
  if (persistedFetch) return persistedFetch;
  const promise = (async () => {
    const db = await getDB();
    return db.getAll(STORE);
  })();
  persistedFetch = promise;
  void promise.finally(() => {
    if (persistedFetch === promise) persistedFetch = null;
  });
  return promise;
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
  const persisted = await fetchPersisted();
  return persisted
    .sort((left, right) => left.createdAt - right.createdAt)
    .map(({ blob, ...meta }) => ({
      ...meta,
      size: blob.size,
      url: URL.createObjectURL(blob),
    }));
};

/**
 * Drop a recording from IndexedDB and release its blob URL. Persist-side
 * failures are logged but swallowed — state is cleared on the user's
 * delete intent regardless, so an IDB-unavailable environment still
 * releases in-memory entries, and a transient failure surfaces again on
 * the next reload. Returns the id so the success action can drop it
 * from state.
 */
export const discardRecording = async (input: {
  id: string;
  url: string;
}): Promise<string> => {
  try {
    await removePersistedRecording(input.id);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to remove recording from IndexedDB', error);
  }
  revokeRecording(input.url);
  return input.id;
};

/**
 * Hydrate persisted recordings against the live library: short-circuit
 * when the library is already loaded, otherwise return the persisted
 * set filtered against recordings already in state and any tombstoned
 * ids. Freshly-minted URLs for filtered entries are revoked so the
 * browser's reference count doesn't leak.
 */
export const reconcilePersistedRecordings = async (
  library: DeepReadonly<LibraryState>,
): Promise<Recording[] | null> => {
  if (library.loaded) return null;
  const persisted = await loadRecordings();
  const seen = new Set(library.recordings.map((entry) => entry.id));
  const tombstoned = new Set(library.tombstones);
  return persisted.filter((entry) => {
    if (seen.has(entry.id) || tombstoned.has(entry.id)) {
      revokeRecording(entry.url);
      return false;
    }
    return true;
  });
};
