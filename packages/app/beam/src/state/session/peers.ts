import { defineCell, defineFold, defineStore, defineTopic } from '@lib/state';
import type { PeerLink } from './capabilities';
import { beamScope } from '../scope';

/**
 * Where a link to one peer sits. This is the transport, not the pairing:
 * a link can be up between two devices that have agreed to nothing, and a
 * trusted pair can have no link at all because one of them is asleep. The
 * address book holds the pairing; this holds whether we can talk right now.
 *
 * - `dialing` — the dial is in flight.
 * - `linked` — the connection is up and messages flow.
 * - `unreachable` — the dial failed. Terminal until something dials again;
 *   there's no retry affordance yet.
 */
export type PeerLinkStatus = 'dialing' | 'linked' | 'unreachable';

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
 * The live connection to each linked peer, held for as long as the session
 * needs to talk over it. A cell, not store state — these are wasm handles
 * and must never be proxied.
 *
 * Replaced wholesale rather than mutated so a reader sees the change; the
 * map is small (one entry per peer met this session) and never hot. Dropping
 * the scope closes every link, which is what ends the receive loop each
 * handle owns on the Rust side.
 */
export const peerHandlesCell = defineCell<ReadonlyMap<string, PeerLink>>(
  beamScope,
  () => new Map(),
  { drop: (handles) => handles.forEach((handle) => handle.release()) },
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
