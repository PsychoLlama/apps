import { BroadcastChannelTransport } from '@lib/messaging/broadcast-channel';

/**
 * Open the log-insertion channel: the same-origin `BroadcastChannel` the
 * backend pings whenever it persists logs and viewers listen on to offer a
 * refresh.
 *
 * The message carries no payload — the event itself is the whole signal. A
 * viewer only needs to know the store moved past what it last read, then
 * re-reads on its own terms.
 *
 * The transport is symmetric, so both sides call the same opener: the backend
 * uses `send`, a viewer wires `onMessage`. A `BroadcastChannel` never echoes a
 * sender its own posts but does deliver to sibling instances, so a viewer
 * sharing the writer's context still hears the pings while the writer hears
 * nothing back. Each side owns its transport — `close` it to detach.
 */
export const createLogInsertedChannel = (): BroadcastChannelTransport<
  void,
  void
> => new BroadcastChannelTransport('@lib/holz-idb-backend');
