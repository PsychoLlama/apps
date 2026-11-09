import type { Migration } from './migrations';
import { promisifyRequest } from './promise';

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
      .forEach((migration) => migration.run(request.result));
  };

  return promisifyRequest(request);
};
