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
 * uses `send`, a viewer wires `onMessage`. It's opened with `selfDeliver`, so
 * one transport both pings and hears pings — a viewer that also writes, or a
 * writer and viewer sharing a single instance, still sees its own inserts
 * rather than relying on holding a separate sibling instance to catch them.
 * Each side owns its transport — `close` it to detach.
 */
export const createLogInsertedChannel = (): BroadcastChannelTransport<void> =>
  new BroadcastChannelTransport({
    channel: '@lib/holz-idb-backend',
    selfDeliver: true,
  });
