import { call, commit, defineSaga, read, spawn } from '@lib/state';
import {
  connectFailedTopic,
  connectedTopic,
  connectingTopic,
  connectionStore,
  p2pStartedTopic,
  relayChangedTopic,
} from '../connection';
import { loadIdentity, openConnection, startP2p } from '../../platform/iroh';
import { receiveNext } from '../../platform/inbox';
import { encodeInviteSaga, identityResolvedTopic } from '../../identity';
import { beamScope } from '../../scope';
import { greetPeerSaga } from './link';
import type { P2pSession } from '../../platform/iroh';

/**
 * Coming up: settling this device's identity, joining the relay network under
 * it, and the two loops that run against the endpoint for as long as it
 * lives.
 */

/**
 * Serve inbound dials for as long as the endpoint is up, handling each peer on
 * its own. Spawned per peer rather than handled in line: a slow greeting to
 * one peer must not hold up the next arrival, and a peer that fails
 * mid-handshake shouldn't take the accept loop down with it.
 */
export const serveInboundSaga = defineSaga(
  beamScope,
  async function* (session: P2pSession) {
    while (true) {
      const peer = yield* call(receiveNext, session.peers);
      yield* spawn(greetPeerSaga(peer));
    }
  },
);

/**
 * Report relay changes for as long as the endpoint is up. Losing a relay
 * isn't a failure — iroh goes and finds another — so this is a status feed
 * rather than an error path, and the status bar's reading is its only reader.
 *
 * Loops forever, like the accept loop, and ends the same way: the scope dies
 * and the abort is swallowed as teardown.
 */
export const watchRelaySaga = defineSaga(
  beamScope,
  async function* (session: P2pSession) {
    while (true) {
      const homeRelay = yield* call(receiveNext, session.relay);
      yield commit(relayChangedTopic(homeRelay));
    }
  },
);

/**
 * Settle this device's identity, then join the relay network under it.
 *
 * Two steps, published separately, because they finish at very different
 * times. The identity is a key derivation — the address is readable the
 * moment the wasm is up and the vault has answered — so the header can name
 * this device and the invite can show its link while the handshake is still
 * a round trip away. Waiting for the relay to say either would leave the page
 * blank for the slowest part of coming up.
 *
 * Once the endpoint lands, three things run against it for the life of the
 * scope: inbound dials are served, relay changes are reported, and the QR
 * encode — started earlier, off the identity — finishes whenever it finishes.
 *
 * Client-only, so `BeamLayout` starts it from `onMount`. Cancellation rides
 * the scope's signal: releasing the last anchor aborts the connect and frees
 * whatever endpoint it landed.
 *
 * Guarded on `started` rather than on the status, which begins at
 * `connecting` for first paint's sake: without it a second anchor could open
 * a second endpoint, which the cell would silently drop unfreed.
 */
export const connectRelaySaga = defineSaga(beamScope, async function* () {
  const { started } = yield* read(connectionStore);
  if (started) return;

  yield commit(connectingTopic());

  try {
    // Committed the instant it exists, before anything else can fail
    // underneath it. From here on the cell owns teardown, so nothing below
    // needs to clean up after itself — including the handshake, which can't be
    // interrupted and may well land after the reader has moved on.
    const session = yield* call(startP2p);
    yield commit(p2pStartedTopic(session));

    const self = yield* call(loadIdentity, session);
    yield commit(identityResolvedTopic(self.endpointId));
    yield* spawn(encodeInviteSaga(self.endpointId));

    yield* call(openConnection, session);
    yield commit(connectedTopic());
    yield* spawn(serveInboundSaga(session));
    yield* spawn(watchRelaySaga(session));
  } catch {
    // Reported by the capability, which has the context to describe it.
    yield commit(connectFailedTopic());
  }
});
