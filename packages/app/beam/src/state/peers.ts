import { defineCell, defineCommand, defineStore } from '@lib/state';
import type { PeerLink } from '../platform/iroh';

/**
 * Where a link to one peer sits. This is the transport, not the relationship:
 * a device in the address book can have no link at all because it's asleep,
 * and a link can be up to one that isn't in the book yet.
 *
 * - `dialing` — the dial is in flight.
 * - `linked` — the connection is up and messages flow.
 * - `unreachable` — the dial failed. Terminal until something dials again.
 * - `closed` — the link was up and ended. Distinct from `unreachable`, which
 *   is a device that was never reached: this one answered and then went.
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

/**
 * How things stand with one peer, in the terms the reader experiences it.
 *
 * - `preparing` — nothing attempted. The endpoint isn't up, or the dial hasn't
 *   started. This is what prerender and first paint show.
 * - `connecting` — the dial is in flight.
 * - `connected` — the link is up. Sharing happens here.
 * - `unreachable` — the dial didn't land.
 * - `disconnected` — the link was up and ended, usually because the peer
 *   walked away from its own share view. Shares go on queueing, and the next
 *   link carries them.
 */
export type PeerState =
  'preparing' | 'connecting' | 'connected' | 'unreachable' | 'disconnected';

/** Which peers this session can currently talk to. */
export const $peerLinks = defineStore<PeerLinks>(() => ({ statuses: {} }));

/**
 * The live link to each peer this session can talk to. A cell, not store
 * state: a {@link PeerLink} carries closures that must not be proxied.
 * Replaced wholesale rather than mutated so a reader sees the change.
 *
 * Nothing to release when it ends. The worker holds the connections, and
 * ending the session asks the endpoint to leave, which closes every one.
 */
export const $peerHandles = defineCell<ReadonlyMap<string, PeerLink>>(
  () => new Map(),
);

/** A dial went out to a peer. */
export const $peerDialing = defineCommand(
  [$peerLinks],
  (links) => (endpointId: string) => {
    links.statuses[endpointId] = 'dialing';
  },
);

/** A link to a peer came up, in either direction. */
export const $peerLinked = defineCommand(
  [$peerLinks, $peerHandles],
  (links, [handles, setHandles]) =>
    (peer: PeerLink) => {
      links.statuses[peer.endpointId] = 'linked';
      setHandles(new Map(handles()).set(peer.endpointId, peer));
    },
);

/** A dial to a peer didn't land. */
export const $peerUnreachable = defineCommand(
  [$peerLinks],
  (links) => (endpointId: string) => {
    links.statuses[endpointId] = 'unreachable';
  },
);

/**
 * A link ended on its own: the peer hung up, or the transport gave out.
 *
 * Carries the handle rather than the id so the command can tell whether the
 * link that ended is still the one being held. It often isn't — a link this
 * device released deliberately closes too, and a replaced link closes as it's
 * swapped out — and marking a peer `closed` on the strength of a connection
 * nothing points at any more would undo the state that replaced it.
 */
export const $peerClosed = defineCommand(
  [$peerLinks, $peerHandles],
  (links, [handles, setHandles]) =>
    (peer: PeerLink) => {
      if (handles().get(peer.endpointId) !== peer) return;

      links.statuses[peer.endpointId] = 'closed';

      const remaining = new Map(handles());
      remaining.delete(peer.endpointId);
      setHandles(remaining);
    },
);

/**
 * A link was let go. The effect closes the connection before this lands;
 * this only drops the bookkeeping that pointed at it.
 */
export const $peerReleased = defineCommand(
  [$peerLinks, $peerHandles],
  (links, [handles, setHandles]) =>
    (endpointId: string) => {
      delete links.statuses[endpointId];

      const remaining = new Map(handles());
      remaining.delete(endpointId);
      setHandles(remaining);
    },
);

// --- Derived ---

/**
 * Which peers can be shared with right now: the ones with a live link this
 * session. A lookup rather than a list, because the address book marks its
 * own entries one row at a time.
 */
export const activePeersOf = (links: PeerLinks): Record<string, true> =>
  Object.fromEntries(
    Object.keys(links.statuses)
      .filter((endpointId) => links.statuses[endpointId] === 'linked')
      .map((endpointId) => [endpointId, true]),
  );

/**
 * How one peer stands. Nothing attempted reads as `preparing`, which is
 * exactly right for a peer nothing has happened with yet.
 */
export const peerStateOf = (
  links: PeerLinks,
  endpointId: string,
): PeerState => {
  switch (links.statuses[endpointId]) {
    case undefined:
      return 'preparing';
    case 'dialing':
      return 'connecting';
    case 'unreachable':
      return 'unreachable';
    case 'closed':
      return 'disconnected';
    case 'linked':
      return 'connected';
  }
};
