/**
 * The version woodland opens its IndexedDB database at. Anything newer
 * under the same name was put there by something else.
 */
const CURRENT_VERSION = 1;

/**
 * Delete the database an earlier Beam left under `name`, if there is one.
 *
 * That Beam kept its own IndexedDB database under the name the device's
 * store has now, at a higher version. A browser won't open a database at a
 * version lower than the one it holds, so until the old one is gone the
 * store can't be opened at all. Nothing in it is read any more.
 *
 * A database at the current version is the device's own and is left alone.
 * Call this before opening the store, and under whatever keeps a second
 * tab off it.
 */
export const clearLegacyStore = async (
  name: string,
  factory: IDBFactory = indexedDB,
): Promise<void> => {
  const databases = await factory.databases();
  const legacy = databases.some(
    (database) =>
      database.name === name && (database.version ?? 0) > CURRENT_VERSION,
  );

  if (!legacy) return;

  await new Promise<void>((resolve, reject) => {
    // If an old tab still has it open the request waits for that tab to
    // close, and so does this.
    const request = factory.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error ?? new Error('Could not delete the old database.'));
  });
};
