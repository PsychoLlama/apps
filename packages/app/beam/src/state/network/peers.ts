import { defineCell, defineFold, defineStore, defineTopic } from '@lib/state';
import type { PeerLink } from '../platform/iroh';
import { beamScope } from '../scope';

/**
 * Where a link to one peer sits. This is the transport, not the relationship:
 * a device in the address book can have no link at all because it's asleep,
 * and a link can be up to one that isn't in the book yet. The address book
 * holds who we know; this holds who we can talk to right now.
 *
 * - `dialing` — the dial is in flight.
 * - `linked` — the connection is up and messages flow.
 * - `unreachable` — the dial failed. Terminal until something dials again;
 *   there's no retry affordance yet.
 * - `closed` — the link was up and ended. Distinct from `unreachable`, which
 *   is a device that was never reached, and from absent, which is a device
 *   nothing has been tried with: this one answered and then went.
 */
export type PeerLinkStatus = 'dialing' | 'linked' | 'unreachable' | 'closed';

/** Which peers this session can currently talk to. */
export interface PeerLinks {
  /**
   * Link status by endpoint id. Absent means nothing has been attempted —
   * which is every peer at first paint, since dialling is client-only.
   */
  statuses: Record<string, PeerLinkStatus>;
}

/** Which peers this session can currently talk to. */
export const peerLinksStore = defineStore<PeerLinks>(beamScope, () => ({
  statuses: {},
}));

/**
 * The live link to each peer this session can talk to. A cell, not store
 * state — still, but for a different reason than before. A {@link PeerLink} is
 * no longer a wasm handle: it's a host-side record naming a connection the p2p
 * worker holds. It stays out of the store because its closures must not be
 * proxied.
 *
 * Replaced wholesale rather than mutated so a reader sees the change; the
 * map is small (one entry per peer met this session) and never hot.
 *
 * No `drop`, deliberately. There is nothing here to release: the worker holds
 * the connections, `sessionCell` owns the session, and releasing that asks the
 * endpoint to leave — which closes every peer connection it was holding. A
 * second, per-peer teardown racing that one would be redundant at best, and at
 * worst it would run after the session had already gone.
 */
export const peerHandlesCell = defineCell<ReadonlyMap<string, PeerLink>>(
  beamScope,
  () => new Map(),
);

/** A dial went out to a peer. */
export const peerDialingTopic = defineTopic<string>();
defineFold(peerDialingTopic, [peerLinksStore], (links, endpointId) => {
  links.statuses[endpointId] = 'dialing';
});

/**
 * A link to a peer came up, in either direction. Carries the handle so the
 * cell can hold it — the same shape as the relay connection landing. The
 * link knows which peer it belongs to, so nothing else has to be paired
 * with it here.
 */
export const peerLinkedTopic = defineTopic<PeerLink>();

defineFold(
  peerLinkedTopic,
  [peerLinksStore, peerHandlesCell],
  (links, handles, peer) => {
    links.statuses[peer.endpointId] = 'linked';
    handles.current = new Map(handles.current).set(peer.endpointId, peer);
  },
);

/** A dial to a peer didn't land. */
export const peerUnreachableTopic = defineTopic<string>();
defineFold(peerUnreachableTopic, [peerLinksStore], (links, endpointId) => {
  links.statuses[endpointId] = 'unreachable';
});

/**
 * A link ended on its own: the peer hung up, or the transport gave out.
 *
 * Carries the handle rather than the id so the fold can tell whether the link
 * that ended is still the one being held. It often isn't — a link this device
 * released deliberately closes too, and a replaced link closes as it's swapped
 * out — and marking a peer `closed` on the strength of a connection nothing
 * points at any more would undo the state that replaced it.
 */
export const peerClosedTopic = defineTopic<PeerLink>();
defineFold(
  peerClosedTopic,
  [peerLinksStore, peerHandlesCell],
  (links, handles, peer) => {
    if (handles.current.get(peer.endpointId) !== peer) return;

    links.statuses[peer.endpointId] = 'closed';

    const remaining = new Map(handles.current);
    remaining.delete(peer.endpointId);
    handles.current = remaining;
  },
);

/**
 * A link was let go. The handle is freed by the saga before this lands —
 * folds are pure, and closing a connection is not — so this only drops the
 * bookkeeping that pointed at it.
 */
export const peerReleasedTopic = defineTopic<string>();
defineFold(
  peerReleasedTopic,
  [peerLinksStore, peerHandlesCell],
  (links, handles, endpointId) => {
    delete links.statuses[endpointId];

    const remaining = new Map(handles.current);
    remaining.delete(endpointId);
    handles.current = remaining;
  },
);
