/** Moves the schema forward by one version. */
export type Migration = (database: IDBDatabase) => void;

/**
 * Every schema migration, oldest first. A migration's position determines its
 * version: index 0 upgrades to v1. Append only.
 */
export const getMigrations = (): Migration[] => [
  (database) => {
    const logs = database.createObjectStore('logs', { autoIncrement: true });

    logs.createIndex('by-timestamp', 'timestamp');
  },
];
