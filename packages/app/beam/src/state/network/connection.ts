import { defineCell, defineFold, defineStore, defineTopic } from '@lib/state';
import type { P2pSession } from '../platform/iroh';
import { beamScope } from '../scope';

/**
 * Where the browser's relay connection sits in its lifecycle.
 *
 * - `connecting` — no relay is carrying us. The wasm is instantiating, the
 *   handshake is in flight, or a relay that was up has gone away and iroh is
 *   finding another. Also what prerender and first paint show: connecting is
 *   automatic, so a freshly loaded page is always already on its way.
 * - `connected` — a relay server has finished its handshake and this device
 *   is reachable; {@link sessionCell} holds the session open.
 * - `failed` — the wasm load or the join errored. Terminal: there's no
 *   reconnect affordance, so the scope stays here until it's released.
 *
 * There is no idle state. It would be indistinguishable from `connecting` to
 * a reader — nobody asks for the connection, so nothing ever sits in it —
 * and rendering it as blank chrome meant the header popped a spinner in a
 * frame or two after load instead of shipping one.
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

  /**
   * Whether a connect has been started. Distinct from `status`, which begins
   * at `connecting` for first paint's sake: this is the one that's false
   * before anything happened, and it's what stops a second anchor opening a
   * second endpoint.
   */
  started: boolean;
}

/** Lifecycle of the browser's membership in the relay network. */
export const connectionStore = defineStore<ConnectionState>(beamScope, () => ({
  status: 'connecting',
  homeRelay: null,
  started: false,
}));

/**
 * This visit's session on the p2p worker, held for the lifetime of the scope.
 * A cell, not store state — it holds queues and closures that must never be
 * proxied. `null` until the worker is up, including during SSG and first
 * paint.
 *
 * Held from the moment the worker answers rather than from the join, which is
 * what makes releasing the scope sufficient at every point after that: a
 * handshake still in flight, one that failed, one that landed — all of them
 * end the same way, by the drop below telling the endpoint to leave.
 *
 * The worker itself is not in here. It belongs to the page and outlives every
 * session; see `state/platform/iroh`.
 */
export const sessionCell = defineCell<P2pSession | null>(
  beamScope,
  () => null,
  { drop: (held) => held?.release() },
);

/** The wasm load and relay handshake got under way. */
export const connectingTopic = defineTopic();
defineFold(connectingTopic, [connectionStore], (connection) => {
  connection.status = 'connecting';
  connection.started = true;
});

/**
 * The p2p worker is up and a session is open on it. Committed before the
 * handshake starts, so the cell owns teardown for everything that follows.
 */
export const p2pStartedTopic = defineTopic<P2pSession>();
defineFold(p2pStartedTopic, [sessionCell], (held, session) => {
  held.current = session;
});

/**
 * The endpoint joined the relay network and is reachable. Payload-less: the
 * session landed earlier, with {@link p2pStartedTopic}, and this only says
 * what became of it.
 */
export const connectedTopic = defineTopic();
defineFold(connectedTopic, [connectionStore], (connection) => {
  connection.status = 'connected';
});

/**
 * The relay carrying this endpoint changed: a server's URL, or `null` when
 * none is connected. Fires for the first relay too, and for every one after
 * it — iroh reconnects on its own, so losing a relay is a status the reader
 * watches rather than a failure anyone has to act on.
 *
 * Ignored once the connect has failed. That state is terminal and the
 * endpoint behind it is gone, so a late change from a watcher still unwinding
 * would only make the header claim a connection nothing is holding.
 */
export const relayChangedTopic = defineTopic<string | null>();
defineFold(relayChangedTopic, [connectionStore], (connection, homeRelay) => {
  if (connection.status === 'failed') return;

  connection.homeRelay = homeRelay;
  connection.status = homeRelay ? 'connected' : 'connecting';
});

/**
 * The wasm load or the relay handshake errored. Payload-less: the failure
 * is logged where it happens and nothing renders it.
 */
export const connectFailedTopic = defineTopic();
defineFold(connectFailedTopic, [connectionStore], (connection) => {
  connection.status = 'failed';
  connection.homeRelay = null;
});
