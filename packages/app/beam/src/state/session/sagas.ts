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
  copyText,
  dialEndpoint,
  encodeBeamCode,
  listenToPeer,
  newShareId,
  openConnection,
  receiveNext,
  releasePeer,
  sendMessage,
  wait,
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
import {
  acceptMessage,
  helloMessage,
  shareMessage,
  type BeamMessage,
} from './protocol';
import type { Inbox } from './inbox';
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
  forgetContactSaga,
  noteAdvertisedNameSaga,
  recordPeerSaga,
} from '../contacts';
import { now } from '../contacts/capabilities';
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
  async function* (input: { endpointId: string; link: PeerConnection }) {
    const { entries } = yield* read(contactsStore);
    if (entries[input.endpointId]?.trust !== 'trusted') return;

    const { items } = yield* read(shareLogStore);
    const queued = items.filter(
      (share) =>
        share.endpointId === input.endpointId && share.status === 'queued',
    );

    for (const share of queued) {
      const delivered = yield* call(
        sendMessage,
        input.link,
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

          if (link) {
            yield* flushSharesSaga({ endpointId: input.endpointId, link });
          }
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

    // Anything written while this peer was away goes out now. This is the
    // other half of queueing: a share composed against a sleeping device is
    // held until the device turns up, and turning up is this.
    yield* flushSharesSaga(input);
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

    const contact = (yield* read(contactsStore)).entries[endpointId];
    logger.info(
      contact?.trust === 'trusted'
        ? 'Reconnecting to a paired device.'
        : 'Inviting a peer to pair.',
      pairing(endpointId, contact),
    );

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
    if (link) yield* flushSharesSaga({ endpointId, link });
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

    const contact = (yield* read(contactsStore)).entries[endpointId];
    logger.info('Withdrew an invite.', pairing(endpointId, contact));

    yield* forgetContactSaga(endpointId);
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

    if (link) yield* flushSharesSaga({ endpointId: input.endpointId, link });
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
