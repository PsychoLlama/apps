import type { LogProcessor } from '@holz/core';
import {
  createBatcher,
  createBuffer,
  createRouter,
  type LogBatcherOptions,
  type LogBufferOptions,
} from '@holz/core/functions';

import { connect, getMigrations, insert, type Schema } from './database';

const DEFAULT_DB_CONFIG: Schema = {
  name: '@holz',
  table: 'logs',
  index: 'by-timestamp',
};

/** Options for {@link createIdbBackend}. */
export interface IdbBackendConfig {
  /** Where logs are persisted. Defaults to {@link DEFAULT_DB_CONFIG}. */
  db?: Schema;

  /** Holds logs while the database opens. Unlimited by default. */
  buffer?: LogBufferOptions;

  /** Groups logs into batches, each written in a single transaction. */
  batch: Pick<LogBatcherOptions, 'size'>;

  /** Max number of logs to retain. Discarded oldest first. */
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
  batch,
  buffer: bufferOptions,
  onError,
}: IdbBackendConfig): IdbBackend => {
  let connection: IDBDatabase | null = null;
  const migrations = getMigrations(config);

  const {
    clear,
    drain: flush,
    processor: addToBatch,
  } = createBatcher({
    ...batch,

    // Batches only fill while connected: through the `db` route, or the flush
    // right after connecting. `close` only flushes while connected.
    sink: (logs) => {
      insert(connection!, config.table, logs).catch(onError);
    },
  });

  const { drain, processor: buffer } = createBuffer(bufferOptions);
  const { select, processor: router } = createRouter('buffer', {
    buffer, // Queue while connecting.
    db: addToBatch, // Persist to IndexedDB.
    drop: () => {}, // Terminal state: sinkhole.
  });

  const sinkhole = () => {
    select('drop'); // Sinkhole future logs.
    clear(); // Clear pending batch.
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
      if (db) drain().forEach(addToBatch);
    },

    // Unrecoverable error. Give up and sinkhole future logs.
    onError: (error) => {
      sinkhole();
      onError(error);
    },
  });

  return {
    processor: router,
    close: () => {
      // Must come first. Transactions already started still finish after the
      // connection closes, but no new ones can start.
      if (connection) flush();

      disconnect();
      sinkhole();
    },
  };
};
