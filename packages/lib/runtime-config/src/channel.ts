import { BroadcastChannelTransport } from '@lib/messaging/broadcast-channel';
import type { JsonValue, Override } from './define-option';

/** The same-origin channel option updates fan out across. */
const CHANNEL = 'runtime-config';

/** A single option's override, announced to sibling browsing contexts. */
export interface ConfigMessage {
  /** The updated option's ID. */
  id: string;

  /** The option's full override after the change. */
  override: Override<JsonValue>;
}

/** `BroadcastChannel` exists only in the browser; gate every use on it. */
const available = (): boolean => typeof BroadcastChannel !== 'undefined';

// One transport per context. A `BroadcastChannel` never delivers a tab's
// own posts back to it, so the publisher and subscriber can share this
// instance: we hear sibling tabs but not our own writes (which we've
// already applied locally).
let transport: BroadcastChannelTransport<ConfigMessage, ConfigMessage> | null =
  null;

const getTransport = (): BroadcastChannelTransport<
  ConfigMessage,
  ConfigMessage
> => (transport ??= new BroadcastChannelTransport(CHANNEL));

/** Announce an option change to other browsing contexts. No-op off-browser. */
export const publish = (message: ConfigMessage): void => {
  if (!available()) return;
  getTransport().send(message);
};

/**
 * Subscribe to option changes from sibling contexts. Returns an
 * unsubscribe; a no-op unsubscribe where `BroadcastChannel` is absent.
 */
export const onConfigMessage = (
  handler: (message: ConfigMessage) => void,
): (() => void) => {
  if (!available()) return () => {};
  return getTransport().onMessage(handler);
};
