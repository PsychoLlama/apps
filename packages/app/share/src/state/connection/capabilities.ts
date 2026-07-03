import type { DeepReadonly } from '@lib/state';
import { closeConnection, dialPeer as dialConnection } from '@lib/iroh';
import type { ConnectionState } from './store';

/**
 * Free the endpoint held in the store, tearing its relay connection down.
 * Adapts `@lib/iroh`'s connection-level {@link closeConnection} to the store
 * shape the effect binds — a no-op before a connection's been opened.
 */
export const releaseConnection = (
  state: DeepReadonly<ConnectionState>,
): void => {
  closeConnection(state.endpoint?.current);
};

/**
 * Dial the peer named in a share link over the store's live endpoint. The
 * caller only dials once the connection is `connected`, so a missing endpoint
 * is a caller bug and throws. The dial itself — and its logging — lives in
 * `@lib/iroh`; this only pulls the endpoint off the store.
 */
export const dialPeer = (
  state: DeepReadonly<ConnectionState>,
  endpointId: string,
): Promise<void> => {
  const endpoint = state.endpoint?.current;
  if (!endpoint) {
    throw new Error('Cannot dial a peer before the relay connection is up.');
  }
  return dialConnection(endpoint, endpointId);
};
