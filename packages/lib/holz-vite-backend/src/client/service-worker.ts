import type { DevSocket } from './vite-backend.ts';

// Vite's socket can't be trusted in a service worker, which has no page to
// reload when the connection breaks:
//
// - A worker installed against an earlier server carries a stale socket
//   token. It never connects, and Vite reports that with no event.
// - A worker can outlive a server restart. Its socket disconnects and never
//   comes back.
//
// Either way, every send fails. So hold messages until `vite:ws:connect`,
// and drop them after `vite:ws:disconnect`.
//
// There's no way to ask whether the socket is already open, so this relies
// on seeing the event. That's safe here: service workers can't `import()`,
// so this module is part of the worker's static graph, which evaluates in
// the startup task. The socket can only open in a later task, after our
// listener is in place.
export const queueUntilConnected = <Message>(
  socket: DevSocket,
  send: (message: Message) => void,
): ((message: Message) => void) => {
  const pending: Message[] = [];

  // Service workers never reconnect, so `disconnected` is final.
  let state: 'connecting' | 'connected' | 'disconnected' = 'connecting';

  socket.on('vite:ws:connect', () => {
    state = 'connected';
    pending.forEach(send);
    pending.length = 0;
  });

  socket.on('vite:ws:disconnect', () => {
    state = 'disconnected';
  });

  return (message) => {
    if (state === 'connected') send(message);
    else if (state === 'connecting') pending.push(message);
  };
};
