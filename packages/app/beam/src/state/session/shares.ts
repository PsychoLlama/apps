import {
  defineFold,
  defineFormula,
  defineStore,
  defineTopic,
} from '@lib/state';
import { contactForgottenTopic } from '../contacts';
import { beamScope } from '../scope';

/**
 * The things two paired devices actually send each other: text, and the links
 * that are a special case of it. Everything here lives for as long as the
 * beam surface is open and no longer — a share is a hand-off between two
 * devices you already have, not a message history, so nothing is written to
 * disk and walking away from `/beam` takes the log with it.
 */

/**
 * The longest body a share may carry. The wire caps an inbound message at
 * 64 KiB, and JSON's worst case is six bytes per UTF-16 unit (a control
 * character escaped as `\uXXXX`), so this is the largest text that can't
 * overrun the transport whatever it contains.
 *
 * Generous for a link or a paragraph, and short of the size where "share
 * some text" turns into "transfer a file" — which is Phase 5's job.
 */
export const SHARE_MAX_LENGTH = 8192;

/**
 * How many shares the session keeps. The log is fed by the network, so it
 * needs a ceiling that doesn't depend on the peer being well-behaved;
 * past it the oldest drop off. Deep enough that a real exchange never
 * notices, small enough that the worst case is a couple of megabytes.
 */
export const SHARE_LOG_LIMIT = 200;

/** How long a copy confirmation stays on screen, in milliseconds. */
export const COPY_NOTICE_DURATION = 2000;

/**
 * Bring a share body down to what the log stores, or `null` if nothing
 * survives. The authority on what a share may be: the folds run every body
 * through it, incoming and outgoing alike.
 *
 * Unlike a name, a body may be several lines — text pasted out of a document
 * arrives with the shape it had — so newlines and tabs are kept and the rest
 * of the control characters go. The ends are trimmed, the length capped, and
 * the ends trimmed again, since a cut can land mid-whitespace.
 */
export const normalizeShare = (raw: string): string | null => {
  const body = raw
    .replace(/[^\P{Cc}\n\t]/gu, '')
    .trim()
    .slice(0, SHARE_MAX_LENGTH)
    .trim();

  return body.length > 0 ? body : null;
};

/**
 * The http(s) URL a share carries, or `null` if it isn't one. Only a body
 * that is *entirely* a URL counts — a sentence with a link in it is text,
 * and picking the link out of it would mean guessing where it ends.
 *
 * The scheme allowlist is the point rather than a tidiness rule. A body
 * arrives from the network, and `javascript:` or `data:` behind an Open
 * button is a way to run a peer's choice of code on this origin. Anything
 * that isn't ordinary web navigation stays text you can read.
 */
export const shareLink = (body: string): string | null => {
  if (/\s/.test(body)) return null;

  let url: URL;

  try {
    url = new URL(body);
  } catch {
    return null;
  }

  return url.protocol === 'http:' || url.protocol === 'https:'
    ? url.href
    : null;
};

/**
 * Where one share stands. Direction is folded in rather than carried
 * alongside, because the combinations that would make don't exist: a share
 * we received was never queued, and one we queued was never received.
 *
 * - `queued` — ours, written but not yet on the wire. Either the peer hasn't
 *   accepted us or it isn't reachable right now.
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
// outlive the pairing it belonged to. The same reasoning as the dismissed
// requests, and the same fold to hang it on.
defineFold(contactForgottenTopic, [shareLogStore], (log, endpointId) => {
  log.items = log.items.filter((item) => item.endpointId !== endpointId);
});

/**
 * Everything shared, grouped by peer and oldest first — the order the share
 * view reads them in, with the newest nearest the composer. A record rather
 * than one peer's shares, because a formula takes no argument: the view looks
 * up the id in its route and falls back to nothing.
 */
export const sharesByPeerFormula = defineFormula(
  [shareLogStore],
  (log): Record<string, Share[]> => {
    const grouped: Record<string, Share[]> = {};

    for (const share of log.items) {
      (grouped[share.endpointId] ??= []).push(share);
    }

    return grouped;
  },
);

/**
 * What the reader has typed but not yet sent, per peer. Kept in the scope
 * rather than the textarea so moving between the share view and a contact's
 * page doesn't quietly discard a half-written note — and, like the invite
 * dialog's flag, because Solid's local state primitives are off-limits here.
 */
export interface Drafts {
  /** The unsent body for each peer, keyed by endpoint id. */
  bodies: Record<string, string>;
}

/** What the reader has typed but not yet sent. */
export const draftsStore = defineStore<Drafts>(beamScope, () => ({
  bodies: {},
}));

/** The reader typed into a peer's composer. */
export const draftChangedTopic = defineTopic<{
  endpointId: string;
  body: string;
}>();

defineFold(draftChangedTopic, [draftsStore], (drafts, { endpointId, body }) => {
  drafts.bodies[endpointId] = body;
});

/** A draft was sent, or given up on. */
export const draftClearedTopic = defineTopic<string>();
defineFold(draftClearedTopic, [draftsStore], (drafts, endpointId) => {
  delete drafts.bodies[endpointId];
});

// A forgotten contact takes its half-written note with it, the same as its
// shares. Nothing here should outlive the peer it was addressed to.
defineFold(contactForgottenTopic, [draftsStore], (drafts, endpointId) => {
  delete drafts.bodies[endpointId];
});

/**
 * Which share was just copied, so the row can say so. One at a time: a
 * confirmation is about the tap that happened, and the tap that happened is
 * the most recent one.
 */
export interface CopyNotice {
  /** The share copied most recently, or `null` if the notice has expired. */
  shareId: string | null;
}

/** Which share was just copied. */
export const copyNoticeStore = defineStore<CopyNotice>(beamScope, () => ({
  shareId: null,
}));

/** A share's text went to the clipboard. */
export const shareCopiedTopic = defineTopic<string>();
defineFold(shareCopiedTopic, [copyNoticeStore], (notice, shareId) => {
  notice.shareId = shareId;
});

/**
 * A copy confirmation timed out. Carries the share it was about so a stale
 * timer can't clear a newer notice: copying a second row while the first
 * confirmation is still up replaces it, and the first timer then has nothing
 * of its own left to take down.
 */
export const copyNoticeExpiredTopic = defineTopic<string>();
defineFold(copyNoticeExpiredTopic, [copyNoticeStore], (notice, shareId) => {
  if (notice.shareId === shareId) notice.shareId = null;
});
