import { defineFormula } from '@lib/state';
import { peerLinksStore } from './peers';

/**
 * Who can be reached right now, and how each peer's connection reads.
 *
 * Everything here is about the link and nothing else. Whether a peer is in
 * the address book decides what it's called, never whether it can be talked
 * to — reaching this device means holding its endpoint id, and that's settled
 * long before any of this.
 */

/**
 * Which peers can be shared with right now: the ones with a live link this
 * session.
 *
 * A lookup rather than a list, because it's read one row at a time: the
 * address book marks its own entries instead of repeating the reachable ones
 * in a second list above itself. Empty until something dials, which includes
 * every first paint.
 */
export const activePeersFormula = defineFormula(
  [peerLinksStore],
  (links): Record<string, true> =>
    Object.fromEntries(
      Object.keys(links.statuses)
        .filter((endpointId) => links.statuses[endpointId] === 'linked')
        .map((endpointId) => [endpointId, true]),
    ),
);

/**
 * How things stand with one peer, in the terms the reader experiences it.
 *
 * - `preparing` — nothing attempted. The endpoint isn't up, or the dial hasn't
 *   started. This is what prerender and first paint show.
 * - `connecting` — the dial is in flight.
 * - `connected` — the link is up. Sharing happens here.
 * - `unreachable` — the dial didn't land. Nothing more happens without
 *   another attempt.
 * - `disconnected` — the link was up and ended, usually because the peer
 *   walked away from its own share view. The contact is untouched: shares go
 *   on queueing, and the next link carries them.
 */
export type PeerState =
  'preparing' | 'connecting' | 'connected' | 'unreachable' | 'disconnected';

/**
 * Where each peer this session knows about stands. A map rather than one
 * peer's state, because a formula takes no argument — the view looks up the
 * id in its route and falls back to `preparing`, which is exactly right for a
 * peer nothing has happened with yet.
 */
export const peerStatesFormula = defineFormula(
  [peerLinksStore],
  (links): Record<string, PeerState> =>
    Object.fromEntries(
      Object.entries(links.statuses).map(([endpointId, status]) => {
        if (status === 'dialing') return [endpointId, 'connecting'];
        if (status === 'unreachable') return [endpointId, 'unreachable'];
        if (status === 'closed') return [endpointId, 'disconnected'];

        return [endpointId, 'connected'];
      }),
    ),
);
