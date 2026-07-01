import { BroadcastChannelTransport } from '@lib/messaging/broadcast-channel';
import type { JsonValue, Override } from './define-config';

/**
 * The same-origin channel name an option's updates ride. One channel per
 * option — defined here so the publish side, the subscribe side, and the
 * tests all derive it the same way instead of spelling the prefix out.
 */
export const channelName = (id: string): string => `runtime-config:${id}`;

/**
 * One option's channel: a single `BroadcastChannel` held open for the option's
 * lifetime, carrying overrides between contexts and — via the transport's
 * `selfDeliver` — back to this context's own subscribers. There's no idle
 * teardown: a subscriber-less channel is never routed to (the browser only
 * delivers to contexts with a live listener), so an open-but-quiet channel
 * costs nothing beyond the tiny local clone of each post.
 */
class OptionChannel {
  // `selfDeliver` folds publish and subscribe onto one instance: a write sent
  // here reaches sibling contexts and echoes back to this context's handlers.
  readonly #transport: BroadcastChannelTransport<Override<JsonValue>>;

  constructor(id: string) {
    this.#transport = new BroadcastChannelTransport({
      channel: channelName(id),
      selfDeliver: true,
    });
  }

  /**
   * Subscribe to overrides from any context, including writes {@link publish}ed
   * here. Returns an unsubscribe.
   */
  onMessage(handler: (override: Override<JsonValue>) => void): () => void {
    return this.#transport.onMessage(handler);
  }

  /**
   * Announce an override to every context, including this one — the transport
   * self-delivers, so a subscriber here hears its own write.
   */
  publish(override: Override<JsonValue>): void {
    this.#transport.send(override);
  }
}

// One `OptionChannel` per option ID. A null-proto map so option IDs can't
// collide with `Object.prototype` keys.
const channels = Object.create(null) as Record<string, OptionChannel>;

const getChannel = (id: string): OptionChannel =>
  (channels[id] ??= new OptionChannel(id));

/**
 * Announce an option change to subscribers in every context, including this
 * one.
 */
export const publish = (id: string, override: Override<JsonValue>): void =>
  getChannel(id).publish(override);

/** Subscribe to one option's changes from any context. Returns an unsubscribe. */
export const onConfigMessage = (
  id: string,
  handler: (override: Override<JsonValue>) => void,
): (() => void) => getChannel(id).onMessage(handler);
