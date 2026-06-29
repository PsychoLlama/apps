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

// One transport per context, built on first use. `BroadcastChannel` is a
// global in both the browser and Node, so there's nothing to feature-detect;
// lazy construction means a context that never publishes or subscribes
// (e.g. SSG) never opens one. A `BroadcastChannel` never delivers a tab's
// own posts back to it, so publisher and subscriber share this instance: we
// hear sibling tabs but not our own writes (already applied locally).
let transport: BroadcastChannelTransport<ConfigMessage, ConfigMessage> | null =
  null;

const getTransport = (): BroadcastChannelTransport<
  ConfigMessage,
  ConfigMessage
> => (transport ??= new BroadcastChannelTransport(CHANNEL));

/** Announce an option change to other browsing contexts. */
export const publish = (message: ConfigMessage): void => {
  getTransport().send(message);
};

/** Subscribe to option changes from sibling contexts. Returns an unsubscribe. */
export const onConfigMessage = (
  handler: (message: ConfigMessage) => void,
): (() => void) => getTransport().onMessage(handler);
