import type { LogProcessor } from '@holz/core';

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

  /**
   * Receives errors from the backend, such as a database that fails to open.
   * Report them however suits your app. For example, pass `console.error`.
   */
  onError: (error: unknown) => void;
}

/** Create the holz backend. Currently discards every log. */
export const createIdbBackend = ({
  db = DEFAULT_DB,
  onError,
}: IdbBackendConfig): LogProcessor => {
  open(db.name, getMigrations(db)).catch(onError);

  return () => {};
};
