import { BroadcastChannelTransport } from '@lib/messaging/broadcast-channel';
import type { Unsubscribe } from '@lib/messaging/transport';

/**
 * The `BroadcastChannel` name carrying log-file announcements. Origin-global,
 * so it's namespaced to keep these events distinct from any unrelated channel.
 */
const LOG_FILE_CHANNEL = 'holz-opfs:log-files';

/**
 * Broadcast when a log file is opened — the event a log viewer listens for to
 * add the new file's row the instant it exists, rather than waiting to
 * re-enumerate the directory.
 *
 * Carries only the `file` name; a viewer already knows the directory and
 * derives everything else (creation time, routing) from the name.
 */
export interface LogFileCreated {
  /** The new file's name within the log directory. */
  file: string;
}

/**
 * Listen for {@link LogFileCreated} announcements from other realms opening log
 * files. Returns an {@link Unsubscribe} that detaches the handler and closes
 * the channel.
 */
export const subscribeLogFiles = (
  handler: (event: LogFileCreated) => void,
): Unsubscribe => {
  const transport = new BroadcastChannelTransport<LogFileCreated, never>(
    LOG_FILE_CHANNEL,
  );
  transport.onMessage(handler);

  // `close` detaches the handler and closes the channel — this subscription
  // owns the whole transport, so tearing it down fully is the unsubscribe.
  return () => transport.close();
};
