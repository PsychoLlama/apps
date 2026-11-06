import type { LogProcessor } from '@holz/core';

/**
 * Create a holz backend that forwards browser logs to the Vite dev server.
 * Install it alongside the app's other backends.
 */
export const createViteBackend = (): LogProcessor => () => {};
