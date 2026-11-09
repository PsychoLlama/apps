import type { LogProcessor } from '@holz/core';

/** Create the holz backend. Currently discards every log. */
export const createIdbBackend = (): LogProcessor => {
  return () => {};
};
