import { BroadcastChannelTransport } from '@lib/messaging/broadcast-channel';

/**
 * Same-origin channel that log-insertion pings ride. Defined here so the
 * publish side (the backend) and the subscribe side (a viewer) derive the same
 * name rather than spelling it out twice.
 */
const CHANNEL = '@lib/holz-idb-backend:log-inserted';

/**
 * A ping that the archive gained logs. It carries no payload — a subscriber
 * only needs to know the store moved past what it last read, then re-reads on
 * its own terms. Typed as a discriminated shape so the channel's traffic is
 * self-describing rather than a bare `undefined`.
 */
export interface LogInserted {
  type: 'log-inserted';
}

const PING: LogInserted = { type: 'log-inserted' };

/**
 * A held-open publisher for the log-insertion channel. `announce` pings every
 * other context; `close` detaches the channel. The backend keeps one for its
 * lifetime rather than opening a channel per write.
 */
export interface LogInsertedPublisher {
  /** Ping every other context that the archive gained logs. */
  announce: () => void;
  /** Detach the channel. */
  close: () => void;
}

/**
 * Open the publish side of the log-insertion channel. A `BroadcastChannel`
 * never echoes a sender its own posts, so the writer's own tab hears nothing
 * back — only sibling contexts (other tabs, the viewer's own transport) do.
 */
export const createLogInsertedPublisher = (): LogInsertedPublisher => {
  const transport = new BroadcastChannelTransport<never, LogInserted>(CHANNEL);
  return {
    announce: () => transport.send(PING),
    close: () => transport.close(),
  };
};

/**
 * Subscribe to log-insertion pings from any context — the writer's tab, a
 * worker, the service worker. Returns an unsubscribe that detaches and closes
 * the channel. Opens its own transport, so a viewer sharing a context with the
 * writer still hears the pings (a channel only withholds a post from the exact
 * instance that sent it).
 */
export const onLogInserted = (handler: () => void): (() => void) => {
  const transport = new BroadcastChannelTransport<LogInserted, never>(CHANNEL);
  const detach = transport.onMessage(() => handler());
  return () => {
    detach();
    transport.close();
  };
};
