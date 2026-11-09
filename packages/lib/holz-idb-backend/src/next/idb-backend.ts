import type { LogProcessor } from '@holz/core';
import {
  createBuffer,
  createRouter,
  type LogBufferOptions,
} from '@holz/core/functions';

import { getMigrations, open, type Schema } from './database';

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
  buffer: bufferOptions,
  onError,
}: IdbBackendConfig): LogProcessor => {
  const { drain, processor: buffer } = createBuffer(bufferOptions);
  const { select, processor: router } = createRouter('buffer', {
    // Queue while IDB is opening.
    buffer,

    // Persist to IDB.
    idb: () => {},

    // Drop logs if we're unable to open IDB.
    drop: () => {},
  });

  open(db.name, getMigrations(db)).then(
    () => select('idb'),
    (error: unknown) => {
      select('drop');
      drain(); // Clear queued logs.

      onError(error);
    },
  );

  return router;
};
