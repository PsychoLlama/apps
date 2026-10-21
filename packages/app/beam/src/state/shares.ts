import { defineCommand, defineStore } from '@lib/state/next';
import { normalizeShare } from './share-body';

/**
 * The things two paired devices actually send each other: text, and the links
 * that are a special case of it.
 *
 * Nothing here is written to disk. A share is a hand-off between two devices
 * you already have, not a message history, so the log lives for as long as
 * the beam surface is open and leaving the app takes it with you.
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
   * another device — so it's only ever rendered as text.
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

/** What a share carries into the log, whichever way it's going. */
export interface ShareEntry {
  /** Stable id, minted by the effect. */
  id: string;

  /** The peer at the other end. */
  endpointId: string;

  /** The text, before normalization. */
  body: string;

  /** When it happened, in epoch milliseconds. */
  at: number;
}

/**
 * What the reader has typed but not yet sent, per peer. Held here rather than
 * in the textarea so moving between the share view and a contact's page
 * doesn't quietly discard a half-written note.
 */
export interface Drafts {
  /** The unsent body for each peer, keyed by endpoint id. */
  bodies: Record<string, string>;
}

/** Everything shared this session. Memory only. */
export const $shareLog = defineStore<ShareLog>(() => ({ items: [] }));

/** What the reader has typed but not yet sent. */
export const $drafts = defineStore<Drafts>(() => ({ bodies: {} }));

/** Add a share to the log, dropping the oldest once it's full. */
const append = (log: ShareLog, share: Share): void => {
  log.items.push(share);
  if (log.items.length > SHARE_LOG_LIMIT) log.items.shift();
};

/**
 * The reader shared something. Queued rather than sent: whether it can go out
 * right now is the transport's business, and a share written to a sleeping
 * device is held rather than lost.
 *
 * The draft goes in the same commit. One is the other having happened, and
 * splitting them would let a paint fall between a cleared field and the row
 * that replaced it.
 */
export const $shareQueued = defineCommand(
  [$shareLog, $drafts],
  (log, drafts) => (entry: ShareEntry) => {
    const body = normalizeShare(entry.body);
    if (body) append(log, { ...entry, body, status: 'queued' });

    delete drafts.bodies[entry.endpointId];
  },
);

/** A queued share reached the peer. */
export const $shareSent = defineCommand([$shareLog], (log) => (id: string) => {
  const share = log.items.find((item) => item.id === id);
  if (share) share.status = 'sent';
});

/** A peer shared something with us. */
export const $shareReceived = defineCommand(
  [$shareLog],
  (log) => (entry: ShareEntry) => {
    const body = normalizeShare(entry.body);
    if (body) append(log, { ...entry, body, status: 'received' });
  },
);

/** The reader typed into a peer's composer. */
export const $draftChanged = defineCommand(
  [$drafts],
  (drafts) => (endpointId: string, body: string) => {
    drafts.bodies[endpointId] = body;
  },
);

// --- Derived ---

/**
 * Everything shared, grouped by peer and newest first — the order the share
 * view reads them in. The composer sits above what it produced, so the thing
 * just shared belongs at the top, nearest the field that sent it.
 */
export const sharesByPeerOf = (log: {
  readonly items: readonly Share[];
}): Record<string, Share[]> => {
  const grouped: Record<string, Share[]> = {};

  for (let index = log.items.length - 1; index >= 0; index -= 1) {
    const share = log.items[index];
    (grouped[share.endpointId] ??= []).push(share);
  }

  return grouped;
};
