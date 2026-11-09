import { promisifyRequest } from './promise';

/**
 * Delete a database, schema and all. Resolves if it doesn't exist. Waits for
 * every open connection to close first.
 */
export const remove = async (name: string): Promise<void> => {
  await promisifyRequest(indexedDB.deleteDatabase(name));
};
