import { call, commit, defineSaga, read } from '@lib/state';
import { createLogger } from '@lib/observability';
import { sendMessage, type PeerLink } from '../../platform/iroh';
import { shareMessage } from '../../platform/protocol';
import { newShareId, now } from '../../platform/host';
import { contactsStore } from '../../contacts';
import { normalizeShare } from '../../share-body';
import {
  draftClearedTopic,
  shareLogStore,
  shareQueuedTopic,
  shareReceivedTopic,
  shareSentTopic,
} from '../../shares';
import { beamScope } from '../../scope';
import { peerHandlesCell } from '../peers';
import { pairingContext } from './pairing-log';

/**
 * Moving shares across a link.
 *
 * The log itself is `state/shares` — what was written, and what became of it.
 * This is the delivery half, and it lives with the links because that's what
 * delivery depends on: a share is queued the moment it's written and goes out
 * whenever there's somebody there to take it.
 */

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

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
        pairingContext(input.endpointId, contact),
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
