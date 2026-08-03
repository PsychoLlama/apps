import {
  defineFold,
  defineFormula,
  defineStore,
  defineTopic,
} from '@lib/state';
import { contactForgottenTopic } from '../contacts';
import { normalizeShare } from '../share-body';
import { beamScope } from '../scope';

/**
 * Everything two paired devices have sent each other this session.
 *
 * Nothing here is written to disk. A share is a hand-off between two devices
 * you already have, not a message history, so the log lives for as long as
 * the beam surface is open and walking away from `/beam` takes it with you.
 */

/**
 * How many shares the session keeps. The log is fed by the network, so it
 * needs a ceiling that doesn't depend on the peer being well-behaved;
 * past it the oldest drop off. Deep enough that a real exchange never
 * notices, small enough that the worst case is a couple of megabytes.
 */
export const SHARE_LOG_LIMIT = 200;

/**
 * Where one share stands. Direction is folded in rather than carried
 * alongside, because the combinations that would make don't exist: a share
 * we received was never queued, and one we queued was never received.
 *
 * - `queued` — ours, written but not yet on the wire. The peer isn't
 *   reachable right now.
 * - `sent` — ours, handed to the transport.
 * - `received` — theirs.
 */
export type ShareStatus = 'queued' | 'sent' | 'received';

/** One thing shared with a peer, in either direction. */
export interface Share {
  /** Stable id, minted when the share enters the log. */
  id: string;

  /** The peer at the other end. */
  endpointId: string;

  /**
   * The text itself. Attacker-controlled when `received` — it arrives from
   * a paired device, which is a device the reader vouched for and not a
   * device the reader controls — so it's only ever rendered as text.
   */
  body: string;

  /** Where the share stands. */
  status: ShareStatus;

  /** When it was queued or arrived, in epoch milliseconds. */
  at: number;
}

/** Everything shared this session, across every peer. */
export interface ShareLog {
  /** Shares in the order they happened, oldest first. */
  items: Share[];
}

/** Everything shared this session. Memory only — it dies with the scope. */
export const shareLogStore = defineStore<ShareLog>(beamScope, () => ({
  items: [],
}));

/** Add a share to the log, dropping the oldest once it's full. */
const append = (log: ShareLog, share: Share): void => {
  log.items.push(share);
  if (log.items.length > SHARE_LOG_LIMIT) log.items.shift();
};

/** What a share carries into the log, whichever way it's going. */
interface ShareEntry {
  /** Stable id, minted by the saga. */
  id: string;
  /** The peer at the other end. */
  endpointId: string;
  /** The text, before normalization. */
  body: string;
  /** When it happened, in epoch milliseconds. */
  at: number;
}

/**
 * The reader shared something. Queued rather than sent: whether it can go out
 * right now is the transport's business, and a share written to a sleeping
 * device is held rather than lost.
 */
export const shareQueuedTopic = defineTopic<ShareEntry>();
defineFold(shareQueuedTopic, [shareLogStore], (log, entry) => {
  const body = normalizeShare(entry.body);
  if (body) append(log, { ...entry, body, status: 'queued' });
});

/** A queued share reached the peer. */
export const shareSentTopic = defineTopic<string>();
defineFold(shareSentTopic, [shareLogStore], (log, id) => {
  const share = log.items.find((item) => item.id === id);
  if (share) share.status = 'sent';
});

/** A peer shared something with us. */
export const shareReceivedTopic = defineTopic<ShareEntry>();
defineFold(shareReceivedTopic, [shareLogStore], (log, entry) => {
  const body = normalizeShare(entry.body);
  if (body) append(log, { ...entry, body, status: 'received' });
});

// Forgetting a contact takes what was shared with it, so the record doesn't
// outlive the pairing it belonged to.
defineFold(contactForgottenTopic, [shareLogStore], (log, endpointId) => {
  log.items = log.items.filter((item) => item.endpointId !== endpointId);
});

/**
 * Everything shared, grouped by peer and newest first — the order the share
 * view reads them in. The composer sits above what it produced, so the thing
 * just shared belongs at the top, nearest the field that sent it; older ones
 * fall away below. A record rather than one peer's shares, because a formula
 * takes no argument: the view looks up the id in its route and falls back to
 * nothing.
 */
export const sharesByPeerFormula = defineFormula(
  [shareLogStore],
  (log): Record<string, Share[]> => {
    const grouped: Record<string, Share[]> = {};

    for (let index = log.items.length - 1; index >= 0; index -= 1) {
      const share = log.items[index];
      (grouped[share.endpointId] ??= []).push(share);
    }

    return grouped;
  },
);
