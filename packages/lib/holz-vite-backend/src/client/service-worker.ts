import type { LogProcessor } from '@holz/core';
import { createBuffer, createRouter } from '@holz/core/functions';

import type { DevSocket } from './vite-backend.ts';

// Vite's socket can't be trusted in a service worker, which has no page to
// reload when the connection breaks:
//
// - A worker installed against an earlier server carries a stale socket
//   token. It never connects, and Vite reports that with no event.
// - A worker can outlive a server restart. Its socket disconnects and never
//   comes back.
//
// Either way, every send fails. So hold logs until `vite:ws:connect`, and
// drop them after `vite:ws:disconnect`.
//
// There's no way to ask whether the socket is already open, so this relies
// on seeing the event. That's safe here: service workers can't `import()`,
// so this module is part of the worker's static graph, which evaluates in
// the startup task. The socket can only open in a later task, after our
// listener is in place.
export const queueUntilConnected = (
  socket: DevSocket,
  send: LogProcessor,
): LogProcessor => {
  const { processor: buffer, drain } = createBuffer({ capacity: 100 });

  // Service workers never reconnect, so `disconnected` is final.
  const { processor: router, select } = createRouter('connecting', {
    connecting: buffer,
    connected: send,
    disconnected: () => {},
  });

  socket.on('vite:ws:connect', () => {
    select('connected');
    drain().forEach(send);
  });

  socket.on('vite:ws:disconnect', () => {
    select('disconnected');
  });

  return router;
};
