/// <reference types="vite/client" />
import type { LogProcessor } from '@holz/core';
import { LOG_EVENT } from '../protocol/events.ts';
import { serializeLog } from '../protocol/serialization.ts';

/**
 * Create a holz backend that forwards browser logs to the Vite dev server.
 * Install it alongside the app's other backends. Without a dev server socket
 * it drops every log.
 */
export const createViteBackend = (): LogProcessor => {
  const socket = import.meta.hot;

  // No dev server socket (production builds, tests, classic workers). Do
  // nothing.
  if (!socket) return () => {};

  return (log) => socket.send(LOG_EVENT, serializeLog(log));
};
