import type { LogProcessor } from '@holz/core';
import {
  createBatcher,
  createBuffer,
  createRouter,
  type LogBatcherOptions,
  type LogBufferOptions,
} from '@holz/core/functions';

import { getMigrations, openOrUpgrade, type Schema } from './database';

const DEFAULT_DB: Schema = {
  name: '@holz',
  table: 'logs',
  index: 'by-timestamp',
};

const DEFAULT_BATCH: NonNullable<IdbBackendConfig['batch']> = {
  size: 1,
};

/** Options for {@link createIdbBackend}. */
export interface IdbBackendConfig {
  /** Where logs are persisted. Defaults to {@link DEFAULT_DB}. */
  db?: Schema;

  /** Holds logs while the database opens. Unlimited by default. */
  buffer?: LogBufferOptions;

  /** Groups logs into batches for writing. Defaults to {@link DEFAULT_BATCH}. */
  batch?: Pick<LogBatcherOptions, 'size'>;

  /**
   * Receives errors from the backend, such as a database that fails to open.
   * Report them however suits your app. For example, pass `console.error`.
   */
  onError: (error: unknown) => void;
}

/**
 * Create the holz backend. Holds logs until the database opens, and discards
 * them if it can't. Doesn't persist logs yet.
 */
export const createIdbBackend = ({
  db = DEFAULT_DB,
  batch = DEFAULT_BATCH,
  buffer: bufferOptions,
  onError,
}: IdbBackendConfig): LogProcessor => {
  const { drain, processor: buffer } = createBuffer(bufferOptions);
  const { processor: batcher } = createBatcher({ ...batch, sink: () => {} });
  const { select, processor: router } = createRouter('buffer', {
    // Queue while IDB is opening.
    buffer,

    // Persist to IDB.
    idb: batcher,

    // Drop logs if we're unable to open IDB.
    drop: () => {},
  });

  openOrUpgrade(db.name, getMigrations(db)).then(
    () => select('idb'),
    (error: unknown) => {
      select('drop');
      drain(); // Clear queued logs.

      onError(error);
    },
  );

  return router;
};
