/** One step in the schema's history. */
export interface Migration {
  /** Stable identifier consumers can use to position their own migrations. */
  name: string;

  /** Moves the schema forward by one version. */
  run: (database: IDBDatabase) => void;
}

/**
 * Every schema migration, oldest first. A migration's position determines its
 * version: index 0 upgrades to v1. Append only.
 */
export const getMigrations = (): Migration[] => [
  {
    name: 'init',
    run: (database) => {
      const logs = database.createObjectStore('logs', { autoIncrement: true });

      logs.createIndex('by-timestamp', 'timestamp');
    },
  },
];
