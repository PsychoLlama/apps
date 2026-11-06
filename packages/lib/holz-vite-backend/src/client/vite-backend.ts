/// <reference types="vite/client" />
import type { LogProcessor } from '@holz/core';
import { LOG_EVENT } from '../protocol/events.ts';
import { serializeLog } from '../protocol/serialization.ts';
import { queueUntilConnected } from './service-worker.ts';

/** The dev server's socket, as `import.meta.hot` exposes it. */
export type DevSocket = NonNullable<ImportMeta['hot']>;

/**
 * Create a holz backend that forwards browser logs to the Vite dev server.
 * Install it alongside the app's other backends. Without a dev server socket
 * it drops every log.
 *
 * In a service worker, logs are held until the socket connects. Create it at
 * startup so it sees the connection.
 */
export const createViteBackend = (): LogProcessor => {
  const socket = import.meta.hot;

  // No dev server socket (production builds, tests, classic workers). Do
  // nothing.
  if (!socket) return () => {};

  const send: LogProcessor = (log) => socket.send(LOG_EVENT, serializeLog(log));

  // Pages and dedicated workers connect reliably, and Vite queues sends until
  // they do. Service workers need their own queue. (The global is only
  // exposed inside service workers.)
  return 'ServiceWorkerGlobalScope' in globalThis
    ? queueUntilConnected(socket, send)
    : send;
};
