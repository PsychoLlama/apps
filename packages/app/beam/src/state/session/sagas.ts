import { AbortError, call, commit, defineSaga, read, spawn } from '@lib/state';
import { createLogger, toError } from '@lib/observability';
import {
  connectFailedTopic,
  connectedTopic,
  connectingTopic,
  connectionStore,
  endpointCell,
  relayChangedTopic,
} from './connection';
import { codeEncodedTopic } from './qr-code';
import {
  awaitPeerClose,
  copyText,
  dialEndpoint,
  encodeBeamCode,
  loadIdentity,
  newShareId,
  openConnection,
  receiveNext,
  releasePeer,
  sendMessage,
  wait,
  type PeerLink,
  type EndpointSession,
} from './capabilities';
import { identityResolvedTopic } from './identity';
import {
  peerClosedTopic,
  peerDialingTopic,
  peerHandlesCell,
  peerLinkedTopic,
  peerLinksStore,
  peerReleasedTopic,
  peerUnreachableTopic,
} from './peers';
import {
  acceptMessage,
  helloMessage,
  shareMessage,
  type BeamMessage,
} from './protocol';
import {
  COPY_NOTICE_DURATION,
  copyNoticeExpiredTopic,
  draftClearedTopic,
  normalizeShare,
  shareCopiedTopic,
  shareLogStore,
  shareQueuedTopic,
  shareReceivedTopic,
  shareSentTopic,
} from './shares';
import {
  acceptContactSaga,
  confirmContactSaga,
  contactsStore,
  noteAdvertisedNameSaga,
  recordPeerSaga,
} from '../contacts';
import { now } from '../contacts/capabilities';
import { selfLabelFormula } from '../device';
import { finishPairingSaga } from '../onboarding';
import { isEndpointId } from '../endpoint-id';
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
 * How a peer reads in a log line: where the pairing stands, not what the
 * transport did. A connection is only interesting for what it means for the
 * pairing, so every event here carries the trust and direction that make it
 * legible — an inbound dial from a stranger and one from a device you paired
 * with last week are the same packet and completely different news.
 *
 * These are the sagas' logs rather than the capabilities' because trust
 * lives in state, and the capability layer can't see it.
 */
const pairing = (
  endpointId: string,
  contact?: { trust: string; direction: string },
) => ({
  endpointId,
  trust: contact?.trust ?? 'unknown',
  direction: contact?.direction ?? 'unknown',
});

/**
 * Hand everything queued for a peer to the transport, in the order it was
 * written. Called wherever a queue might have become sendable: a link coming
 * up, and either side of the pairing being accepted.
 *
 * Takes the link rather than looking one up, so the caller that just
 * established it isn't reading its own commit back out of a cell. Callers
 * that don't hold one look first and skip the flush — an absent peer's queue
 * simply waits for the next link.
 *
 * The trust guard is the point rather than defensive noise, and it lives
 * here so there's one of it: the queue fills from the moment the composer
 * does, which is before the peer has answered, so a share only leaves once
 * the reader has accepted them.
 *
 * Stops at the first send that doesn't land. The link is gone, and marching
 * through the rest of the queue against a dead connection would report a
 * pile of shares as sent that nobody received.
 */
export const flushSharesSaga = defineSaga(
  beamScope,
  async function* (peer: PeerLink) {
    const { entries } = yield* read(contactsStore);
    if (entries[peer.endpointId]?.trust !== 'trusted') return;

    const { items } = yield* read(shareLogStore);
    const queued = items.filter(
      (share) =>
        share.endpointId === peer.endpointId && share.status === 'queued',
    );

    for (const share of queued) {
      const delivered = yield* call(
        sendMessage,
        peer,
        shareMessage(share.body),
      );

      if (!delivered) break;
      yield commit(shareSentTopic(share.id));
    }
  },
);

/**
 * Take something a peer shared. Only from a device the reader accepted:
 * a stranger can dial in and start talking before anyone has agreed to
 * anything, and a screen that fills with text from whoever asks is a screen
 * that can be shouted at. Refused shares are logged rather than silently
 * dropped — it's the one message that means somebody tried.
 */
export const receiveShareSaga = defineSaga(
  beamScope,
  async function* (input: { endpointId: string; body: string }) {
    const contact = (yield* read(contactsStore)).entries[input.endpointId];

    if (contact?.trust !== 'trusted') {
      logger.warn(
        'Dropped a share from a peer we haven’t paired with.',
        pairing(input.endpointId, contact),
      );

      return;
    }

    const at = yield* call(now);
    const id = yield* call(newShareId);

    yield commit(
      shareReceivedTopic({
        id,
        endpointId: input.endpointId,
        body: input.body,
        at,
      }),
    );
  },
);

/**
 * Act on one message from a peer. This is the whole of what a peer is able
 * to say to us, and each branch lands through a saga that decides whether to
 * believe it — an advertised name can never overwrite a local one, a claimed
 * acceptance only counts when we're the side that was waiting, and a share
 * only counts from a peer that was accepted.
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

      case 'share':
        yield* receiveShareSaga({
          endpointId: input.endpointId,
          body: input.message.body,
        });
        break;

      case 'accept': {
        // Read either side of the fold rather than restating its rule here.
        // The fold decides whether a claimed acceptance counts; what's worth
        // knowing is whether it did, and a check that duplicated the guard
        // would be free to drift away from it.
        //
        // The trust itself, not the record holding it. A read hands back a
        // live view of the store, so a record kept across the commit reports
        // the value it has *now* — which would make this comparison one
        // between the new trust and itself, always equal, always false.
        const before = (yield* read(contactsStore)).entries[input.endpointId]
          ?.trust;

        yield* confirmContactSaga(input.endpointId);
        const contact = (yield* read(contactsStore)).entries[input.endpointId];

        if (before !== contact?.trust) {
          logger.info(
            'A peer accepted our invite.',
            pairing(input.endpointId, contact),
          );

          // They've said yes, so whatever was written while they were
          // deciding goes out — over the link their acceptance arrived on.
          const handles = yield* read(peerHandlesCell);
          const link = handles.get(input.endpointId);

          if (link) yield* flushSharesSaga(link);
        } else if (contact?.trust !== 'trusted') {
          // Either a stranger promoting itself or a peer answering an invite
          // we've since withdrawn. Worth seeing: the first is the attack the
          // direction check exists to stop.
          logger.warn(
            'Ignored an acceptance from a peer we aren’t waiting on.',
            pairing(input.endpointId, contact),
          );
        }

        break;
      }
    }
  },
);

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
 * listening, and introduce ourselves. Both directions land here — a dial and
 * an accept differ only in who started it, and from the link onward they're
 * the same conversation.
 *
 * The link arrives already listening — the capability wires its message
 * queue as it wraps the connection — so a peer that answers the greeting
 * immediately isn't answering into a void.
 *
 * The acceptance re-sent here is what makes pairing eventually consistent:
 * accepting a peer that's away sends nothing at the time, so the next link
 * to a contact we already trust carries the news. Cheap, idempotent, and it
 * spares both devices having to remember an unsent message.
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

    const label = yield* read(selfLabelFormula);
    if (label) yield* call(sendMessage, peer, helloMessage(label));

    const { entries } = yield* read(contactsStore);
    if (entries[peer.endpointId]?.trust === 'trusted') {
      yield* call(sendMessage, peer, acceptMessage());
    }

    // Anything written while this peer was away goes out now. This is the
    // other half of queueing: a share composed against a sleeping device is
    // held until the device turns up, and turning up is this.
    yield* flushSharesSaga(peer);
  },
);

/** Take an inbound dial: file the peer as having asked, then link it. */
export const greetPeerSaga = defineSaga(
  beamScope,
  async function* (peer: PeerLink) {
    yield* recordPeerSaga({
      endpointId: peer.endpointId,
      direction: 'inbound',
    });

    // Somebody found us, which is the whole of what setup's last step asks
    // for. A no-op once it's been answered.
    yield* finishPairingSaga();

    // Logged after the sighting, so a first-time dial reads as the request
    // it just became rather than as an unknown peer.
    const contact = (yield* read(contactsStore)).entries[peer.endpointId];
    logger.info(
      contact?.trust === 'trusted'
        ? 'A paired device connected.'
        : 'A peer asked to pair.',
      pairing(peer.endpointId, contact),
    );

    yield* linkPeerSaga(peer);
  },
);

/**
 * Serve inbound dials for as long as the endpoint is up, handling each peer on
 * its own. Spawned per peer rather than handled in line: a slow greeting to
 * one peer must not hold up the next arrival, and a peer that fails
 * mid-handshake shouldn't take the accept loop down with it.
 */
export const serveInboundSaga = defineSaga(
  beamScope,
  async function* (session: EndpointSession) {
    while (true) {
      const peer = yield* call(receiveNext, session.peers);
      yield* spawn(greetPeerSaga(peer));
    }
  },
);

/**
 * Report relay changes for as long as the endpoint is up. Losing a relay
 * isn't a failure — iroh goes and finds another — so this is a status feed
 * rather than an error path, and the header's indicator is its only reader.
 *
 * Loops forever, like the accept loop, and ends the same way: the scope dies
 * and the abort is swallowed as teardown.
 */
export const watchRelaySaga = defineSaga(
  beamScope,
  async function* (session: EndpointSession) {
    while (true) {
      const homeRelay = yield* call(receiveNext, session.relay);
      yield commit(relayChangedTopic(homeRelay));
    }
  },
);

/**
 * Encode this device's beam link into a scannable grid.
 *
 * Spawned rather than awaited so it runs alongside the relay handshake: both
 * need the wasm, neither needs the other, and the invite is readable from the
 * link alone while the code is still being drawn.
 */
export const encodeInviteSaga = defineSaga(
  beamScope,
  async function* (endpointId: string) {
    const grid = yield* call(encodeBeamCode, endpointId);
    yield commit(codeEncodedTopic(grid));
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
    const self = yield* call(loadIdentity);
    yield commit(identityResolvedTopic(self.endpointId));
    yield* spawn(encodeInviteSaga(self.endpointId));

    const session = yield* call(openConnection, self);
    yield commit(connectedTopic(session));
    yield* spawn(serveInboundSaga(session));
    yield* spawn(watchRelaySaga(session));
  } catch {
    // Reported by the capability, which has the context to describe it.
    yield commit(connectFailedTopic());
  }
});

/**
 * Dial the peer named in a beam link over the relay connection the layout
 * holds open, recording it in the address book first so the pairing survives
 * the reload the dial might not. The caller only dials once the connection is
 * `connected`, so a missing endpoint is a caller bug and throws.
 *
 * An id that isn't an address is dropped before any of that. The book is
 * written before the dial — deliberately, so a pairing survives the reload
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

    yield* recordPeerSaga({ endpointId, direction: 'outbound' });

    // We found somebody, which answers setup's last step just as well as
    // being found does. Committed before the dial, like the contact is: a
    // peer that turns out to be asleep is still a peer this device has met.
    yield* finishPairingSaga();

    const contact = (yield* read(contactsStore)).entries[endpointId];
    logger.info(
      contact?.trust === 'trusted'
        ? 'Reconnecting to a paired device.'
        : 'Inviting a peer to pair.',
      pairing(endpointId, contact),
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

    const contact = (yield* read(contactsStore)).entries[endpointId];
    logger.info('Accepted a peer’s request to pair.', {
      ...pairing(endpointId, contact),
      // Whether the peer heard it now or hears it on the next link. The
      // difference is invisible from here and matters when someone asks why
      // the other device still says it's waiting.
      delivered: Boolean(link),
    });

    // Accepting is the moment sharing becomes allowed, so anything written
    // to this peer beforehand goes out with the acceptance.
    if (link) yield* flushSharesSaga(link);
  },
);

/**
 * Hang up on a peer, leaving the pairing alone.
 *
 * This is what leaving a share view does. A connection is the expensive,
 * device-visible half of a pairing — it holds a relay stream open on both
 * ends and keeps the other device listed as reachable — and the share view is
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

/**
 * Share what the composer holds. The share lands in the log queued and the
 * draft goes in the same transition — one is the other having happened, and
 * splitting them would let a paint fall between a cleared field and the row
 * that replaced it.
 *
 * A body with nothing in it is dropped rather than reported. The composer's
 * own button is disabled for one, so getting here with one means whitespace,
 * and refusing to send whitespace needs no explanation.
 */
export const shareTextSaga = defineSaga(
  beamScope,
  async function* (input: { endpointId: string; body: string }) {
    if (!normalizeShare(input.body)) return;

    const at = yield* call(now);
    const id = yield* call(newShareId);

    yield commit(
      shareQueuedTopic({
        id,
        endpointId: input.endpointId,
        body: input.body,
        at,
      }),
      draftClearedTopic(input.endpointId),
    );

    // Straight out if the peer is here to take it. If it isn't, the share
    // stays queued and the next link carries it.
    const handles = yield* read(peerHandlesCell);
    const link = handles.get(input.endpointId);

    if (link) yield* flushSharesSaga(link);
  },
);

/**
 * Copy a share's text, and say so for a moment. The confirmation is the
 * whole point of routing this through a saga: the clipboard gives no visible
 * sign it worked, and a button that answers nothing reads as a button that
 * did nothing.
 *
 * Nothing is claimed if the copy was refused — the clipboard is
 * permissioned, and a confirmation for a copy that didn't happen is worse
 * than no confirmation at all.
 */
export const copyShareSaga = defineSaga(
  beamScope,
  async function* (input: { id: string; body: string }) {
    const copied = yield* call(copyText, input.body);
    if (!copied) return;

    yield commit(shareCopiedTopic(input.id));
    yield* call(wait, COPY_NOTICE_DURATION);
    yield commit(copyNoticeExpiredTopic(input.id));
  },
);
