import { AbortError, call, commit, defineSaga, read, spawn } from '@lib/state';
import { createLogger, toError } from '@lib/observability';
import type { PeerConnection, Relay } from '@crate/iroh';
import {
  connectFailedTopic,
  connectedTopic,
  connectingTopic,
  connectionStore,
  relayCell,
} from './connection';
import { codeEncodedTopic } from './qr-code';
import {
  acceptInboundPeers,
  dialEndpoint,
  encodeBeamCode,
  listenToPeer,
  openConnection,
  receiveNext,
  releasePeer,
  sendMessage,
  type InboundPeer,
} from './capabilities';
import { selfLabelFormula } from './identity';
import {
  peerDialingTopic,
  peerHandlesCell,
  peerLinkedTopic,
  peerLinksStore,
  peerReleasedTopic,
  peerUnreachableTopic,
} from './peers';
import { acceptMessage, helloMessage, type BeamMessage } from './protocol';
import type { Inbox } from './inbox';
import {
  acceptContactSaga,
  confirmContactSaga,
  contactsStore,
  forgetContactSaga,
  noteAdvertisedNameSaga,
  recordPeerSaga,
} from '../contacts';
import { beamScope } from '../scope';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Build a `catch` handler for a saga run. The sagas here commit their own
 * failures, so the rejection left over is the abort from a released anchor —
 * ordinary teardown, and nothing to report. Anything else is a bug, and
 * surfacing it beats letting it land as an unhandled rejection.
 */
export const reportSagaFailure =
  (message: string) =>
  (error: unknown): void => {
    if (error instanceof AbortError) return;
    logger.error(message, { error: toError(error) });
  };

/**
 * Act on one message from a peer. This is the whole of what a peer is able
 * to say to us, and both branches land in the address book through a saga
 * that decides whether to believe it — an advertised name can never
 * overwrite a local one, and a claimed acceptance only counts when we're the
 * side that was waiting.
 */
export const applyPeerMessageSaga = defineSaga(
  beamScope,
  async function* (input: { endpointId: string; message: BeamMessage }) {
    switch (input.message.type) {
      case 'hello':
        yield* noteAdvertisedNameSaga({
          endpointId: input.endpointId,
          label: input.message.label,
        });
        break;

      case 'accept':
        yield* confirmContactSaga(input.endpointId);
        break;
    }
  },
);

/**
 * Read messages off one peer link until the scope dies.
 *
 * Loops forever by design: it's spawned, so the abort that ends it is
 * swallowed as ordinary teardown rather than reported. A link that closes
 * early leaves this parked rather than exiting — the connection-closed
 * signal isn't surfaced yet, and a parked saga costs nothing until the scope
 * releases it.
 */
const pumpPeerSaga = defineSaga(
  beamScope,
  async function* (input: { endpointId: string; inbox: Inbox<BeamMessage> }) {
    while (true) {
      const message = yield* call(receiveNext, input.inbox);
      yield* applyPeerMessageSaga({ endpointId: input.endpointId, message });
    }
  },
);

/**
 * Take a freshly established link into the session: hold the handle, start
 * listening, and introduce ourselves. Both directions land here — a dial and
 * an accept differ only in who started it, and from the link onward they're
 * the same conversation.
 *
 * The listener starts before the greeting goes out, so a peer that answers
 * immediately isn't answering into a void.
 *
 * The acceptance re-sent here is what makes pairing eventually consistent:
 * accepting a peer that's away sends nothing at the time, so the next link
 * to a contact we already trust carries the news. Cheap, idempotent, and it
 * spares both devices having to remember an unsent message.
 */
export const linkPeerSaga = defineSaga(
  beamScope,
  async function* (input: { endpointId: string; link: PeerConnection }) {
    // A second link to the same peer replaces the first. Freeing the old
    // handle closes a connection nothing is reading any more; leaving it
    // would strand it open for the life of the scope.
    const handles = yield* read(peerHandlesCell);
    const previous = handles.get(input.endpointId);
    if (previous) yield* call(releasePeer, previous);

    yield commit(peerLinkedTopic(input));

    const inbox = yield* call(listenToPeer, input.link);
    yield* spawn(pumpPeerSaga({ endpointId: input.endpointId, inbox }));

    const label = yield* read(selfLabelFormula);
    if (label) yield* call(sendMessage, input.link, helloMessage(label));

    const { entries } = yield* read(contactsStore);
    if (entries[input.endpointId]?.trust === 'trusted') {
      yield* call(sendMessage, input.link, acceptMessage());
    }
  },
);

/** Take an inbound dial: file the peer as having asked, then link it. */
export const greetPeerSaga = defineSaga(
  beamScope,
  async function* (peer: InboundPeer) {
    yield* recordPeerSaga({
      endpointId: peer.endpointId,
      direction: 'inbound',
    });

    yield* linkPeerSaga(peer);
  },
);

/**
 * Serve inbound dials for as long as the relay is up, handling each peer on
 * its own. Spawned per peer rather than handled in line: a slow greeting to
 * one peer must not hold up the next arrival, and a peer that fails
 * mid-handshake shouldn't take the accept loop down with it.
 */
export const serveInboundSaga = defineSaga(
  beamScope,
  async function* (relay: Relay) {
    const inbox = yield* call(acceptInboundPeers, relay);

    while (true) {
      const peer = yield* call(receiveNext, inbox);
      yield* spawn(greetPeerSaga(peer));
    }
  },
);

/**
 * Join the relay network and encode this endpoint's beam link, landing the
 * live relay and its QR grid in a single transition so the view never shows a
 * connection without its code (nor a stale code without its connection).
 * Inbound dials are served from the moment it lands.
 *
 * Client-only — neither the wasm fetch nor the handshake can run during SSG —
 * so `BeamLayout` starts it from `onMount`. Cancellation rides the scope's
 * signal: releasing the last anchor aborts the connect and frees whatever
 * relay it landed.
 *
 * Guarded on `initial` so a second anchor can't open a second relay, which
 * the cell would silently drop unfreed.
 */
export const connectRelaySaga = defineSaga(beamScope, async function* () {
  const { status } = yield* read(connectionStore);
  if (status !== 'initial') return;

  yield commit(connectingTopic());

  try {
    const endpoint = yield* call(openConnection);
    const grid = yield* call(encodeBeamCode, endpoint.endpointId);
    yield commit(connectedTopic(endpoint), codeEncodedTopic(grid));
    yield* spawn(serveInboundSaga(endpoint));
  } catch {
    // Reported by the capability, which has the context to describe it.
    yield commit(connectFailedTopic());
  }
});

/**
 * Dial the peer named in a beam link over the relay connection the layout
 * holds open, recording it in the address book first so the pairing survives
 * the reload the dial might not. The caller only dials once the connection is
 * `connected`, so a missing relay is a caller bug and throws.
 *
 * Opening your own beam link is a no-op rather than an error — it's what
 * happens when you scan the code off your own screen, and dialling yourself
 * would both fail and leave a contact for this very device in the book.
 *
 * A peer already dialled or linked this session is left alone. Returning to
 * the share view re-runs this, and a second dial would replace a working
 * link with an identical one for nothing.
 */
export const dialPeerSaga = defineSaga(
  beamScope,
  async function* (endpointId: string) {
    const endpoint = yield* read(relayCell);
    if (!endpoint) {
      throw new Error('Cannot dial a peer before the relay connection is up.');
    }

    if (endpointId === endpoint.endpointId) return;

    const { statuses } = yield* read(peerLinksStore);
    if (statuses[endpointId] === 'dialing') return;
    if (statuses[endpointId] === 'linked') return;

    yield* recordPeerSaga({ endpointId, direction: 'outbound' });
    yield commit(peerDialingTopic(endpointId));

    try {
      const link = yield* call(dialEndpoint, endpoint, endpointId);
      yield* linkPeerSaga({ endpointId, link });
    } catch {
      // Reported by the capability, which has the context to describe it.
      yield commit(peerUnreachableTopic(endpointId));
    }
  },
);

/**
 * Accept a peer's request to pair: promote it here, then tell it, so both
 * sides end up trusted. The message only goes out if the peer is linked
 * right now — an absent one hears about it on the next link, which is why
 * {@link linkPeerSaga} re-sends the acceptance.
 */
export const acceptPairingSaga = defineSaga(
  beamScope,
  async function* (endpointId: string) {
    yield* acceptContactSaga(endpointId);

    const handles = yield* read(peerHandlesCell);
    const link = handles.get(endpointId);
    if (link) yield* call(sendMessage, link, acceptMessage());
  },
);

/**
 * Take back an invite we sent: drop the link and forget the contact. The
 * peer is told nothing — there's no message for withdrawing, and one would
 * only matter to a device that has already been asked to decide. What it
 * sees is a stranger the next time either side dials.
 */
export const cancelPairingSaga = defineSaga(
  beamScope,
  async function* (endpointId: string) {
    const handles = yield* read(peerHandlesCell);
    const link = handles.get(endpointId);

    if (link) {
      yield* call(releasePeer, link);
      yield commit(peerReleasedTopic(endpointId));
    }

    yield* forgetContactSaga(endpointId);
  },
);
