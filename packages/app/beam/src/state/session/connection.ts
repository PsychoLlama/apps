import {
  defineCell,
  defineFold,
  defineStore,
  defineTopic,
} from '@lib/state-next';
import type { Relay } from '@crate/iroh';
import { beamScope } from '../scope';

/**
 * Where the browser's relay connection sits in its lifecycle.
 *
 * - `initial` — nothing attempted yet. The site is SSG'd and the wasm
 *   fetch + relay handshake are client-only, so this is what prerender and
 *   first paint show.
 * - `connecting` — the wasm is instantiating and/or the relay handshake is
 *   in flight.
 * - `connected` — the endpoint is live on the relay network; {@link relayCell}
 *   holds it open.
 * - `failed` — the wasm load or handshake errored. Terminal: there's no
 *   reconnect affordance, so the scope stays here until it's released.
 *   Distinct from `initial` so the UI can flag the error rather than look
 *   like nothing was attempted.
 */
export type ConnectionStatus =
  'initial' | 'connecting' | 'connected' | 'failed';

/** The browser's live membership in the iroh relay network. */
export interface ConnectionState {
  /** Where the connection sits in its lifecycle. */
  status: ConnectionStatus;
}

/** Lifecycle of the browser's membership in the relay network. */
export const connectionStore = defineStore<ConnectionState>(beamScope, () => ({
  status: 'initial',
}));

/**
 * The live endpoint joined to the relay network, held for the lifetime of
 * the scope so it stays reachable. A cell, not store state — it holds a
 * wasm handle that must never be proxied. `null` outside the `connected`
 * state, including during SSG and first paint.
 *
 * Freeing it tears the relay connection down, which is what `drop` does
 * once the last anchor is released.
 */
export const relayCell = defineCell<Relay | null>(beamScope, () => null, {
  drop: (held) => held?.free(),
});

/** The wasm load and relay handshake got under way. */
export const connectingTopic = defineTopic();
defineFold(connectingTopic, [connectionStore], (connection) => {
  connection.status = 'connecting';
});

/** The endpoint joined the relay network and is reachable. */
export const connectedTopic = defineTopic<Relay>();
defineFold(
  connectedTopic,
  [connectionStore, relayCell],
  (connection, held, endpoint) => {
    connection.status = 'connected';
    held.current = endpoint;
  },
);

/**
 * The wasm load or the relay handshake errored. Payload-less: the failure
 * is logged where it happens and nothing renders it.
 */
export const connectFailedTopic = defineTopic();
defineFold(connectFailedTopic, [connectionStore], (connection) => {
  connection.status = 'failed';
});
