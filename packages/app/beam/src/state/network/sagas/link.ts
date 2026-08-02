import { call, commit, defineSaga, read, spawn } from '@lib/state';
import { createLogger } from '@lib/observability';
import {
  awaitPeerClose,
  dialEndpoint,
  releasePeer,
  sendMessage,
  type PeerLink,
} from '../../platform/iroh';
import { receiveNext } from '../../platform/inbox';
import { helloMessage } from '../../platform/protocol';
import { contactsStore, recordPeerSaga } from '../../contacts';
import { deviceNameFormula } from '../../identity';
import { finishPairingSaga } from '../../onboarding';
import { isEndpointId } from '../../endpoint';
import { beamScope } from '../../scope';
import { endpointCell } from '../connection';
import {
  peerClosedTopic,
  peerDialingTopic,
  peerHandlesCell,
  peerLinkedTopic,
  peerLinksStore,
  peerReleasedTopic,
  peerUnreachableTopic,
} from '../peers';
import { peerContext } from './peer-log';
import { applyPeerMessageSaga } from './messages';
import { flushSharesSaga } from './shares';

/**
 * The life of one peer link: opening it, holding it, reading off it, and
 * letting it go.
 *
 * Both directions land in the same place. A dial and an inbound connection
 * differ only in who started them, and from {@link linkPeerSaga} onward
 * they're the same conversation.
 */

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Read messages off one peer link until the scope dies.
 *
 * Loops forever by design: it's spawned, so the abort that ends it is
 * swallowed as ordinary teardown rather than reported. A link that closes
 * early leaves this parked rather than exiting — {@link watchPeerSaga} is
 * what notices that, and a parked saga costs nothing until the scope releases
 * it.
 */
const pumpPeerSaga = defineSaga(beamScope, async function* (peer: PeerLink) {
  while (true) {
    const message = yield* call(receiveNext, peer.messages);
    yield* applyPeerMessageSaga({ endpointId: peer.endpointId, message });
  }
});

/**
 * Wait for one peer link to end, and say so.
 *
 * Every link gets one, in either direction, because either end can hang up:
 * walking away from a share view closes the connection from that side, and
 * this is how the device left holding it finds out rather than going on
 * showing a peer that isn't there.
 *
 * Deliberate teardown here settles the same promise, so this fires for links
 * this device released too. Sorting that out is the fold's job — it holds the
 * handle, so it can see whether the link that ended is still the current one.
 */
const watchPeerSaga = defineSaga(beamScope, async function* (peer: PeerLink) {
  yield* call(awaitPeerClose, peer);
  logger.debug('A peer link closed.', { endpointId: peer.endpointId });
  yield commit(peerClosedTopic(peer));
});

/**
 * Take a freshly established link into the session: hold the handle, start
 * listening, and introduce ourselves.
 *
 * The link arrives already listening — the capability wires its message
 * queue as it wraps the connection — so a peer that answers the greeting
 * immediately isn't answering into a void.
 */
export const linkPeerSaga = defineSaga(
  beamScope,
  async function* (peer: PeerLink) {
    // A second link to the same peer replaces the first. Releasing the old
    // handle closes a connection nothing is reading any more; leaving it
    // would strand it open for the life of the scope.
    const handles = yield* read(peerHandlesCell);
    const previous = handles.get(peer.endpointId);
    if (previous) yield* call(releasePeer, previous);

    yield commit(peerLinkedTopic(peer));
    yield* spawn(pumpPeerSaga(peer));
    yield* spawn(watchPeerSaga(peer));

    const label = yield* read(deviceNameFormula);
    if (label) yield* call(sendMessage, peer, helloMessage(label));

    // Anything written while this peer was away goes out now. This is the
    // other half of queueing: a share composed against a sleeping device is
    // held until the device turns up, and turning up is this.
    yield* flushSharesSaga(peer);
  },
);

/** Take an inbound dial: file the peer in the address book, then link it. */
export const greetPeerSaga = defineSaga(
  beamScope,
  async function* (peer: PeerLink) {
    // Logged before the sighting files it, so a device turning up for the
    // first time reads as new rather than as one we already had.
    const { entries } = yield* read(contactsStore);
    const known = Boolean(entries[peer.endpointId]);

    yield* recordPeerSaga(peer.endpointId);

    // Somebody found us, which is the whole of what setup's last step asks
    // for. A no-op once it's been answered.
    yield* finishPairingSaga();

    logger.info(
      known ? 'A known device connected.' : 'A new device connected.',
      peerContext(peer.endpointId, known),
    );

    yield* linkPeerSaga(peer);
  },
);

/**
 * Dial the peer named in a beam link over the relay connection the layout
 * holds open, recording it in the address book first so the contact survives
 * the reload the dial might not. The caller only dials once the connection is
 * `connected`, so a missing endpoint is a caller bug and throws.
 *
 * An id that isn't an address is dropped before any of that. The book is
 * written before the dial — deliberately, so a contact survives the reload
 * the dial might not — which means a peer that's merely asleep is worth
 * recording, and one that could never exist is not. `/beam/share/bacon` is a
 * URL anybody can type, and without this it leaves a contact behind forever.
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
    if (!isEndpointId(endpointId)) return;

    const session = yield* read(endpointCell);
    if (!session) {
      throw new Error('Cannot dial a peer before the relay connection is up.');
    }

    if (endpointId === session.endpoint.id) return;

    const { statuses } = yield* read(peerLinksStore);
    if (statuses[endpointId] === 'dialing') return;
    if (statuses[endpointId] === 'linked') return;

    const { entries } = yield* read(contactsStore);
    const known = Boolean(entries[endpointId]);

    yield* recordPeerSaga(endpointId);

    // We found somebody, which answers setup's last step just as well as
    // being found does. Committed before the dial, like the contact is: a
    // peer that turns out to be asleep is still a peer this device has met.
    yield* finishPairingSaga();

    logger.info(
      known ? 'Reconnecting to a known device.' : 'Reaching a new device.',
      peerContext(endpointId, known),
    );

    yield commit(peerDialingTopic(endpointId));

    try {
      const link = yield* call(dialEndpoint, session.endpoint, endpointId);
      yield* linkPeerSaga(link);
    } catch {
      // Reported by the capability, which has the context to describe it.
      yield commit(peerUnreachableTopic(endpointId));
    }
  },
);

/**
 * Hang up on a peer, leaving the contact alone.
 *
 * This is what leaving a share view does. A connection is the expensive,
 * device-visible half of knowing someone — it holds a relay stream open on
 * both ends and keeps the other device listed as reachable — and the share
 * view is
 * the only place either matters, so it ends with the view rather than with
 * the scope. Closing it tells the peer plainly, which is the whole reason the
 * far side can show `disconnected` instead of a link that quietly stops
 * answering.
 *
 * Nothing is lost by it: the contact stays, anything unsent stays queued, and
 * coming back re-dials and flushes.
 *
 * A no-op for a peer with no live link — an inbound one may never have been
 * dialled from here at all.
 */
export const disconnectPeerSaga = defineSaga(
  beamScope,
  async function* (endpointId: string) {
    const handles = yield* read(peerHandlesCell);
    const link = handles.get(endpointId);
    if (!link) return;

    yield* call(releasePeer, link);
    yield commit(peerReleasedTopic(endpointId));
  },
);
