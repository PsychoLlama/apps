/**
 * The things two paired devices actually send each other: text, and the links
 * that are a special case of it.
 *
 * State only. Everything here lives for as long as the beam surface is open
 * and no longer — a share is a hand-off between two devices you already have,
 * not a message history — so nothing is written to disk and walking away from
 * `/beam` takes the log with it.
 *
 * Getting a share onto the wire, and taking one off it, belongs to
 * `state/network`: that's where the links are, and delivery is a property of
 * the link rather than of the log. What lives here is what was written, what
 * became of it, and what's half-written still.
 */
export {
  queuedSharesFormula,
  shareLogStore,
  shareQueuedTopic,
  shareReceivedTopic,
  shareSentTopic,
  sharesByPeerFormula,
} from './log';
export type { Share } from './log';
export { draftChangedTopic, draftClearedTopic, draftsStore } from './drafts';
export { copyNoticeStore, copyShareSaga } from './notice';
