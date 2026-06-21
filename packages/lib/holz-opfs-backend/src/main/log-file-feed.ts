import { BroadcastChannelTransport } from '@lib/messaging/broadcast-channel';
import type { Unsubscribe } from '@lib/messaging/transport';

/**
 * The `BroadcastChannel` name carrying log-file announcements. Origin-global,
 * so it's namespaced to keep these events distinct from any unrelated channel.
 */
const LOG_FILE_CHANNEL = 'holz-opfs:log-files';

/**
 * Broadcast when a session opens its OPFS log file — the event a log viewer
 * listens for to add the new file's row the instant it exists, rather than
 * waiting to re-enumerate the directory.
 *
 * Carries only the `file` name; a viewer already knows the directory and
 * derives everything else (creation time, routing) from the name.
 */
export interface LogFileCreated {
  /** The new file's name within the log directory (see `LogLocation.file`). */
  file: string;
}

/**
 * Announce to other log viewers — in other tabs and in this one — that this
 * session has opened `file`. Fire-and-forget: open a channel, post, close.
 * A `BroadcastChannel` never delivers to the instance that posts, so this is
 * heard only by the separate channels {@link subscribeLogFiles} opens, never
 * by this announcer.
 *
 * Closing right after posting is safe: the message is already queued for
 * delivery to sibling channels, and this announcer has nothing to receive.
 */
export const announceLogFile = (file: string): void => {
  const transport = new BroadcastChannelTransport<never, LogFileCreated>(
    LOG_FILE_CHANNEL,
  );
  transport.send({ file });
  transport.close();
};

/**
 * Listen for {@link LogFileCreated} announcements from sessions opening their
 * log files — both other tabs (a viewer can't see their files until they
 * enumerate) and this tab's own worker (whose file may not exist yet when the
 * viewer first reads the directory). Returns an {@link Unsubscribe} that
 * detaches the handler and closes the channel.
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
