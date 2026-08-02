import { call, defineSaga, read } from '@lib/state';
import { createLogger } from '@lib/observability';
import { sendMessage } from '../../platform/iroh';
import { acceptMessage, helloMessage } from '../../platform/protocol';
import type { BeamMessage } from '../../platform/protocol';
import {
  acceptContactSaga,
  confirmContactSaga,
  contactsStore,
  noteAdvertisedNameSaga,
} from '../../contacts';
import { deviceNameFormula, nameDeviceSaga } from '../../identity';
import { beamScope } from '../../scope';
import { peerHandlesCell } from '../peers';
import { pairingContext } from './pairing-log';
import { flushSharesSaga, receiveShareSaga } from './shares';

/**
 * The handshake: what a peer is allowed to change about a pairing by saying
 * so, and what this device says back.
 *
 * The address book records what a pairing *is*; this decides what a message
 * on the wire means for it. Every branch lands through a saga that gets to
 * disbelieve the claim — an advertised name can never overwrite a local one,
 * a claimed acceptance only counts when we're the side that was waiting, and
 * a share only counts from a peer that was accepted.
 */

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Take a peer's claim to have accepted us.
 *
 * The fold decides whether it counts, and this reads either side of it rather
 * than restating its rule — a check that duplicated the guard would be free
 * to drift away from it. What's read is the trust itself, not the record
 * holding it: a read hands back a live view, so a record kept across the
 * commit reports the value it has *now*, which would make the comparison one
 * between the new trust and itself.
 */
const takeAcceptanceSaga = defineSaga(
  beamScope,
  async function* (endpointId: string) {
    const before = (yield* read(contactsStore)).entries[endpointId]?.trust;

    yield* confirmContactSaga(endpointId);
    const contact = (yield* read(contactsStore)).entries[endpointId];

    if (before !== contact?.trust) {
      logger.info(
        'A peer accepted our invite.',
        pairingContext(endpointId, contact),
      );

      // They've said yes, so whatever was written while they were deciding
      // goes out — over the link their acceptance arrived on.
      const handles = yield* read(peerHandlesCell);
      const link = handles.get(endpointId);

      if (link) yield* flushSharesSaga(link);

      return;
    }

    if (contact?.trust !== 'trusted') {
      // Either a stranger promoting itself or a peer answering an invite
      // we've since withdrawn. Worth seeing: the first is the attack the
      // direction check exists to stop.
      logger.warn(
        'Ignored an acceptance from a peer we aren’t waiting on.',
        pairingContext(endpointId, contact),
      );
    }
  },
);

/**
 * Act on one message from a peer. This is the whole of what a peer is able
 * to say to us.
 *
 * The share branch is deliberately somewhere else: taking one is about the
 * log, and the rule that guards it is the same trust check this module
 * enforces everywhere else.
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

      case 'accept':
        yield* takeAcceptanceSaga(input.endpointId);
        break;
    }
  },
);

/**
 * Accept a peer's request to pair: promote it here, then tell it, so both
 * sides end up trusted. The message only goes out if the peer is linked
 * right now — an absent one hears about it on the next link, which is why
 * `linkPeerSaga` re-sends the acceptance.
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
      ...pairingContext(endpointId, contact),
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
 * Rename this device and tell whoever is listening, answering whether the
 * rename took.
 *
 * The greeting `linkPeerSaga` sends is the only time a peer hears what this
 * device is called, so a rename that stopped at disk would leave every device
 * already on the line calling this one by a name it no longer answers to —
 * until it happened to reconnect, which may be days. Re-greeting is the
 * cheapest fix: `hello` is idempotent on the far side, where it lands as the
 * advertised name and never overwrites a nickname the reader chose.
 *
 * It's here rather than in `state/identity` because the peers are here. That
 * module owns what this device is called; this one owns who has been told.
 *
 * Absent peers are not chased. They hear it on the next link, which is the
 * same bargain acceptance makes.
 */
export const renameDeviceSaga = defineSaga(
  beamScope,
  async function* (label: string | null) {
    const renamed = yield* nameDeviceSaga(label);
    if (!renamed) return false;

    // Read back rather than reused: a cleared name falls back to the key
    // prefix, and that fallback is what peers should be told.
    const announced = yield* read(deviceNameFormula);
    if (!announced) return true;

    const handles = yield* read(peerHandlesCell);
    for (const link of handles.values()) {
      yield* call(sendMessage, link, helloMessage(announced));
    }

    return true;
  },
);
