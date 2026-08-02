import { defineFormula } from '@lib/state';
import { contactsStore } from '../contacts';
import { peerLinksStore } from './peers';

/**
 * Who can be reached right now, and how each peer's connection reads.
 *
 * The join between the two halves of a pairing: the address book says what a
 * peer *is* to this device, and the link statuses say whether we can talk to
 * it this second. Neither answers on its own — a peer that hasn't accepted us
 * isn't allowed to receive anything, and a peer that's asleep can't — so
 * everything a view asks about a peer's standing is derived here.
 */

/**
 * Which peers can be shared with right now: paired, and with a live link this
 * session.
 *
 * A lookup rather than a list, because it's read one row at a time: the
 * address book marks its own entries instead of repeating the reachable ones
 * in a second list above itself. Empty until something dials, which includes
 * every first paint.
 */
export const activePeersFormula = defineFormula(
  [contactsStore, peerLinksStore],
  (book, links): Record<string, true> =>
    Object.fromEntries(
      Object.keys(links.statuses)
        .filter(
          (endpointId) =>
            links.statuses[endpointId] === 'linked' &&
            book.entries[endpointId]?.trust === 'trusted',
        )
        .map((endpointId) => [endpointId, true]),
    ),
);

/**
 * How things stand with one peer — the transport and the pairing read as one
 * thing, because that's how the reader experiences it.
 *
 * - `preparing` — nothing attempted. The endpoint isn't up, or the dial hasn't
 *   started. This is what prerender and first paint show.
 * - `connecting` — the dial is in flight.
 * - `awaiting` — the link is up and we've asked; they haven't answered.
 * - `connected` — linked and paired. The only state where sharing happens.
 * - `unreachable` — the dial didn't land. Nothing more happens without
 *   another attempt.
 * - `disconnected` — the link was up and ended, usually because the peer
 *   walked away from its own share view. The pairing is untouched: shares go
 *   on queueing, and the next link carries them.
 *
 * There is no `declined`. Refusing a request sends nothing — it's inaction,
 * and inaction has no message — so a caller can't be told no. What it sees
 * instead is `awaiting`, indefinitely, which is the truth of it.
 */
export type PeerState =
  | 'preparing'
  | 'connecting'
  | 'awaiting'
  | 'connected'
  | 'unreachable'
  | 'disconnected';

/**
 * Where each peer this session knows about stands. A map rather than one
 * peer's state, because a formula takes no argument — the view looks up the
 * id in its route and falls back to `preparing`, which is exactly right for a
 * peer nothing has happened with yet.
 */
export const peerStatesFormula = defineFormula(
  [peerLinksStore, contactsStore],
  (links, book): Record<string, PeerState> =>
    Object.fromEntries(
      Object.entries(links.statuses).map(([endpointId, status]) => {
        if (status === 'dialing') return [endpointId, 'connecting'];
        if (status === 'unreachable') return [endpointId, 'unreachable'];
        if (status === 'closed') return [endpointId, 'disconnected'];

        return [
          endpointId,
          book.entries[endpointId]?.trust === 'trusted'
            ? 'connected'
            : 'awaiting',
        ];
      }),
    ),
);
