import type { Group, Item } from '@crate/beam';
import type { EngineEvents } from './engine/engine';

/**
 * What the device worker tells the page, unprompted.
 *
 * Lives at the top of the package, free of host runtime deps, so the worker
 * can import {@link HostApi} to type its notifications without dragging the
 * page's `Worker`-spawning graph into a worker-typed build.
 */

/**
 * Build the page's handlers for one worker: each piece of news goes
 * straight to the feed the page gave.
 */
export const createHostHandlers = (feed: EngineEvents) => ({
  events: {
    opened: (device: { deviceId: string }) => feed.opened(device),
    heldElsewhere: () => feed.heldElsewhere(),
    openFailed: (failure: { reason: string }) => feed.openFailed(failure),
    relayChanged: (change: { homeRelay: string | null }) =>
      feed.relayChanged(change),
    groupsChanged: (change: { groups: Group[] }) => feed.groupsChanged(change),
    feedChanged: (change: { groupId: string; items: Item[] }) =>
      feed.feedChanged(change),
  },
});

/**
 * The page's surface, as the worker sees it. Derived from
 * {@link createHostHandlers} rather than restated, so the two can't drift.
 */
export type HostApi = ReturnType<typeof createHostHandlers>;
