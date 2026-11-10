import type { LogProcessor } from '@holz/core';
import {
  createBatcher,
  createBuffer,
  createRouter,
  type LogBatcherOptions,
  type LogBufferOptions,
} from '@holz/core/functions';

import {
  connect,
  getMigrations,
  insert,
  type DatabaseConfig,
  type Migration,
} from './database';

const DEFAULT_DB_CONFIG: DatabaseConfig = {
  name: '@holz',
  table: 'logs',
  index: 'by-timestamp',
};

/** Options for {@link createIdbBackend}. */
export interface IdbBackendConfig {
  /** Where logs are persisted. Defaults to {@link DEFAULT_DB_CONFIG}. */
  db?: DatabaseConfig;

  /**
   * Customize the schema's migrations, e.g. to add your own. Receives the
   * defaults, oldest first, and returns the full list. A migration's position
   * is its version, so never reorder or remove one that has shipped.
   */
  migrations?: (defaults: Migration[]) => Migration[];

  /** Holds logs while the database opens. Unlimited by default. */
  buffer?: LogBufferOptions;

  /** Groups logs into batches, each written in a single transaction. */
  batch: Pick<LogBatcherOptions, 'size'>;

  /**
   * Max number of logs to retain. Discards the earliest written first, which
   * may not be the earliest timestamp.
   */
  retain: number;

  /**
   * Receives errors from the backend, such as a database that fails to open.
   * Report them however suits your app. For example, pass `console.error`.
   */
  onError: (error: unknown) => void;
}

/** A backend created by {@link createIdbBackend}. */
export interface IdbBackend {
  /** Install this in your logging pipeline. */
  processor: LogProcessor;

  /**
   * Write the pending batch now, without waiting for it to fill. Call this
   * when the app may stop soon, such as when the page is hidden. Logs still
   * waiting on the database to open aren't written.
   */
  flush: () => void;

  /**
   * Write any pending batch, then disconnect from the database and discard all
   * logs from then on.
   */
  close: () => void;
}

/**
 * Create the holz backend. Holds logs until the database opens, and discards
 * them if it can't.
 */
export const createIdbBackend = ({
  db: config = DEFAULT_DB_CONFIG,
  migrations: customize = (defaults) => defaults,
  batch: batchOptions,
  buffer: bufferOptions,
  retain,
  onError,
}: IdbBackendConfig): IdbBackend => {
  let connection: IDBDatabase | null = null;
  const migrations = customize(getMigrations(config));

  const batch = createBatcher({
    ...batchOptions,

    // Batches only fill while connected: through the `db` route, or the flush
    // right after connecting. `close` only drains while connected.
    sink: (logs) => {
      insert(connection!, logs, { table: config.table, retain }).catch(onError);
    },
  });

  const { drain, processor: buffer } = createBuffer(bufferOptions);
  const { select, processor: router } = createRouter('buffer', {
    buffer, // Queue while connecting.
    db: batch.processor, // Persist to IndexedDB.
    noop: () => {}, // Terminal state: sinkhole.
  });

  const discardAndYield = () => {
    select('noop'); // Ignore future logs.
    batch.clear(); // Clear pending batch.
    drain(); // Clear queued logs.
  };

  const disconnect = connect({
    name: config.name,
    migrations,

    // May invoke multiple times. Handle is released and re-acquired if new
    // tabs/processes have new migrations, if the DB is deleted, or if the
    // browser closes it (e.g. storage was cleared).
    onChange: (db) => {
      connection = db;
      select(db ? 'db' : 'buffer');

      // Flush logs that were buffered while connecting.
      if (db) drain().forEach(batch.processor);
    },

    // Unrecoverable error. Give up and sinkhole future logs.
    onError: (error) => {
      discardAndYield();
      onError(error);
    },
  });

  // Batches only fill while connected, so there's nothing to write otherwise.
  const flush = () => {
    if (connection) batch.drain();
  };

  const close = () => {
    flush();
    disconnect();
    discardAndYield();
  };

  return { processor: router, flush, close };
};
