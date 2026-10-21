import { defineCommand, defineStore } from '@lib/state';

/**
 * Where the browser's relay connection sits in its lifecycle.
 *
 * - `connecting` — no relay is carrying us. The wasm is instantiating, the
 *   handshake is in flight, or a relay that was up has gone away and iroh is
 *   finding another. Also what prerender and first paint show: connecting is
 *   automatic, so a freshly loaded page is always already on its way.
 * - `connected` — a relay server has finished its handshake and this device
 *   is reachable.
 * - `failed` — the wasm load or the join errored. Terminal: there's no
 *   reconnect affordance, so it stays here until the session is released.
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'failed';

/** The browser's live membership in the iroh relay network. */
export interface ConnectionState {
  /** Where the connection sits in its lifecycle. */
  status: ConnectionStatus;

  /**
   * The relay server currently carrying this endpoint, or `null` when none
   * is. Redundant with `status` for rendering — it's the diagnostic half,
   * worth having when the question is *which* relay rather than whether.
   */
  homeRelay: string | null;
}

/** Lifecycle of the browser's membership in the relay network. */
export const $connection = defineStore<ConnectionState>(() => ({
  status: 'connecting',
  homeRelay: null,
}));

/** The endpoint joined the relay network and is reachable. */
export const $connected = defineCommand([$connection], (connection) => () => {
  connection.status = 'connected';
});

/**
 * The relay carrying this endpoint changed: a server's URL, or `null` when
 * none is connected. iroh reconnects on its own, so losing a relay is a
 * status the reader watches rather than a failure anyone has to act on.
 *
 * Ignored once the connect has failed. That state is terminal, and a late
 * change would only make the header claim a connection nothing is holding.
 */
export const $relayChanged = defineCommand(
  [$connection],
  (connection) => (homeRelay: string | null) => {
    if (connection.status === 'failed') return;

    connection.homeRelay = homeRelay;
    connection.status = homeRelay ? 'connected' : 'connecting';
  },
);

/** The wasm load or the relay handshake errored. */
export const $connectFailed = defineCommand(
  [$connection],
  (connection) => () => {
    connection.status = 'failed';
    connection.homeRelay = null;
  },
);
