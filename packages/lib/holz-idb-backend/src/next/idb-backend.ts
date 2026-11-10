import type { LogProcessor } from '@holz/core';
import {
  createBatcher,
  createBuffer,
  createRouter,
  type LogBatcherOptions,
  type LogBufferOptions,
} from '@holz/core/functions';

import { connect, getMigrations, type Schema } from './database';

const DEFAULT_DB: Schema = {
  name: '@holz',
  table: 'logs',
  index: 'by-timestamp',
};

/** Options for {@link createIdbBackend}. */
export interface IdbBackendConfig {
  /** Where logs are persisted. Defaults to {@link DEFAULT_DB}. */
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

  /** Disconnect from the database and discard all logs from then on. */
  close: () => void;
}

/**
 * Create the holz backend. Holds logs until the database opens, and discards
 * them if it can't. Doesn't persist logs yet.
 */
export const createIdbBackend = ({
  db = DEFAULT_DB,
  batch,
  buffer: bufferOptions,
  onError,
}: IdbBackendConfig): IdbBackend => {
  const { drain, processor: buffer } = createBuffer(bufferOptions);
  const { clear, processor: batcher } = createBatcher({
    ...batch,
    sink: () => {},
  });

  const { select, processor: router } = createRouter('buffer', {
    // Queue while IDB is connecting.
    buffer,

    // Persist to IDB.
    idb: batcher,

    // Drop logs once IDB is closed or unavailable.
    drop: () => {},
  });

  const discard = () => {
    select('drop');
    drain(); // Clear queued logs.
    clear(); // Clear the partial batch.
  };

  const disconnect = connect({
    name: db.name,
    migrations: getMigrations(db),
    onChange: (database) => select(database ? 'idb' : 'buffer'),
    onError: (error) => {
      discard();
      onError(error);
    },
  });

  return {
    processor: router,
    close: () => {
      disconnect();
      discard();
    },
  };
};
