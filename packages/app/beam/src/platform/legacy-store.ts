/**
 * The object stores an earlier Beam kept, in an IndexedDB database of its
 * own. Either one says whose database it is.
 */
const LEGACY_STORES = ['contacts', 'onboarding'];

/**
 * What an open rejects with when what's kept under the store's name isn't
 * a store it can open. See `Device.open` in `@crate/beam`.
 */
const MISMATCHED = 'StoreMismatched';

/** The database called `name`, as it is, with no upgrade. */
const openAsIs = (name: string, factory: IDBFactory): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = factory.open(name);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Could not open the old database.'));
  });

const deleteDatabase = (name: string, factory: IDBFactory): Promise<void> =>
  new Promise((resolve, reject) => {
    // If an old tab still has it open the request waits for that tab to
    // close, and so does this.
    const request = factory.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error ?? new Error('Could not delete the old database.'));
  });

/**
 * Delete the database called `name` if an earlier Beam made it. Resolves
 * with whether it did.
 *
 * Told by what's in it, not by its version: a database with none of that
 * Beam's object stores is something else's, a later version of the store
 * included, and is left exactly as it was.
 */
export const clearLegacyStore = async (
  name: string,
  factory: IDBFactory = indexedDB,
): Promise<boolean> => {
  const database = await openAsIs(name, factory);
  const legacy = LEGACY_STORES.some((store) =>
    database.objectStoreNames.contains(store),
  );
  database.close();

  if (!legacy) return false;

  await deleteDatabase(name, factory);
  return true;
};

/**
 * Open the device's store with `open`, getting an earlier Beam's database
 * out of the way if that's what refuses it.
 *
 * That Beam kept an IndexedDB database under the name the store has now. A
 * browser won't open one database as another, so the open is refused as
 * mismatched until the old one is gone. Nothing in it is read any more.
 *
 * Only that is cleared. Any other refusal, and a mismatch with anything
 * that isn't the earlier Beam's, is passed on untouched. Call this under
 * whatever keeps a second tab off the store.
 */
export const openOverLegacy = async <Opened>(
  name: string,
  open: () => Promise<Opened>,
  factory: IDBFactory = indexedDB,
): Promise<Opened> => {
  try {
    return await open();
  } catch (error) {
    const mismatched = error instanceof Error && error.name === MISMATCHED;
    if (!mismatched || !(await clearLegacyStore(name, factory))) throw error;
  }

  return open();
};
