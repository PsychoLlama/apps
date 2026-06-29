import { BroadcastChannelTransport } from '@lib/messaging/broadcast-channel';
import type { JsonValue, Override } from './define-option';

/**
 * The same-origin channel name an option's updates ride. One channel per
 * option — defined here so the publish side, the subscribe side, and the
 * tests all derive it the same way instead of spelling the prefix out.
 */
export const channelName = (id: string): string => `runtime-config:${id}`;

/**
 * The subscribe side of one option's channel: a `BroadcastChannel` held open
 * only while something is listening, with sibling posts fanned out to every
 * local handler. Idle options cost nothing — no channel exists until the first
 * subscriber, and it's torn down again once the last one leaves.
 */
class OptionChannel {
  readonly #name: string;

  // Live only while `#subscribers > 0`. A counter, not a handler set: the
  // transport already owns the listeners, so we track just enough to know when
  // the channel has gone idle and can close.
  #transport: BroadcastChannelTransport<
    Override<JsonValue>,
    Override<JsonValue>
  > | null = null;
  #subscribers = 0;

  constructor(id: string) {
    this.#name = channelName(id);
  }

  /** Subscribe to overrides from any context. Returns an unsubscribe. */
  onMessage(handler: (override: Override<JsonValue>) => void): () => void {
    const transport = (this.#transport ??= new BroadcastChannelTransport(
      this.#name,
    ));
    const detach = transport.onMessage(handler);
    this.#subscribers++;

    let active = true;
    return () => {
      if (!active) return;
      active = false;
      detach();
      if (--this.#subscribers === 0) {
        transport.close();
        this.#transport = null;
      }
    };
  }
}

// One `OptionChannel` per option ID, built on first subscribe. A null-proto map
// so option IDs can't collide with `Object.prototype` keys.
const channels = Object.create(null) as Record<string, OptionChannel>;

const getChannel = (id: string): OptionChannel =>
  (channels[id] ??= new OptionChannel(id));

/**
 * Announce an option change to subscribers in every context, including this
 * one. Opens a throwaway channel for the single post and closes it right away,
 * so a writer that isn't also subscribed never holds IPC open for traffic it
 * doesn't watch. The throwaway is a *distinct* `BroadcastChannel` instance, so
 * a same-context subscriber hears the write back through the channel (a channel
 * only withholds a post from the exact instance that sent it).
 */
export const publish = (id: string, override: Override<JsonValue>): void => {
  const transport = new BroadcastChannelTransport<
    Override<JsonValue>,
    Override<JsonValue>
  >(channelName(id));
  transport.send(override);
  transport.close();
};

/** Subscribe to one option's changes from any context. Returns an unsubscribe. */
export const onConfigMessage = (
  id: string,
  handler: (override: Override<JsonValue>) => void,
): (() => void) => getChannel(id).onMessage(handler);
