/**
 * IndexedDB persistence for the endpoint's secret key.
 *
 * iroh derives an endpoint's identity — and therefore its share link —
 * from its secret key. Left to itself the wasm mints a throwaway key on
 * every connect, so a reload would hand a peer a different link. Saving
 * the raw key bytes here and restoring them on the next connect keeps the
 * identity stable across reloads.
 *
 * The key is stored as its raw `Uint8Array`. IndexedDB's structured clone
 * round-trips typed arrays as bytes, so there's no base64 detour — the
 * same bytes go straight to and from the wasm boundary.
 */

const DB_NAME = 'iroh-share';
const DB_VERSION = 1;
const STORE_NAME = 'endpoint';

/** The single-entry key under which the secret key lives in the store. */
const SECRET_KEY_ID = 'secret-key';

/** Wrap a request's `DOMException` (or its absence) as an `Error` to reject with. */
const requestError = (request: IDBRequest): Error =>
  new Error(request.error?.message ?? 'IndexedDB request failed', {
    cause: request.error,
  });

/** Open (and, first time, create) the key database. */
const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(requestError(request));
  });

/**
 * Run one request against the object store and resolve with its result,
 * closing the connection once the work settles either way.
 */
const withStore = async <Result>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<Result>,
): Promise<Result> => {
  const db = await openDatabase();
  try {
    return await new Promise<Result>((resolve, reject) => {
      const request = run(
        db.transaction(STORE_NAME, mode).objectStore(STORE_NAME),
      );
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(requestError(request));
    });
  } finally {
    db.close();
  }
};

/** Load the saved endpoint secret key, or `undefined` if none is stored. */
export const loadSecretKey = async (): Promise<Uint8Array | undefined> => {
  const stored = await withStore<unknown>('readonly', (store) =>
    store.get(SECRET_KEY_ID),
  );
  return stored instanceof Uint8Array ? stored : undefined;
};

/** Persist the endpoint secret key, replacing any previously stored one. */
export const saveSecretKey = async (secretKey: Uint8Array): Promise<void> => {
  await withStore('readwrite', (store) => store.put(secretKey, SECRET_KEY_ID));
};
