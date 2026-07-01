import { BroadcastChannelTransport } from '@lib/messaging/broadcast-channel';
import type { JsonValue, Override } from './define-config';

/**
 * The same-origin channel name an option's updates ride. One channel per
 * option — defined here so the publish side, the subscribe side, and the
 * tests all derive it the same way instead of spelling the prefix out.
 */
export const channelName = (id: string): string => `runtime-config:${id}`;

/**
 * One option's channel: a `BroadcastChannel` held open only while something is
 * listening, carrying overrides between contexts and — via the transport's
 * `localEmit` — back to this context's own subscribers. Idle options cost
 * nothing: no channel exists until the first subscriber, and it's torn down
 * again once the last one leaves.
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

  /**
   * Subscribe to overrides from any context, including writes {@link publish}ed
   * here. Returns an unsubscribe.
   */
  onMessage(handler: (override: Override<JsonValue>) => void): () => void {
    const transport = (this.#transport ??= this.#open());
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

  /**
   * Announce an override to every context, including this one. When something
   * here is listening, the live transport self-emits so this context hears its
   * own write; otherwise a throwaway carries the post to other contexts and
   * closes right away, so a writer that isn't subscribed holds no IPC open.
   */
  publish(override: Override<JsonValue>): void {
    if (this.#transport) {
      this.#transport.send(override);
      return;
    }

    const transport = this.#open();
    transport.send(override);
    transport.close();
  }

  // `localEmit` folds publish and subscribe onto one instance: a write sent
  // here reaches sibling contexts and echoes back to this context's handlers.
  #open(): BroadcastChannelTransport<Override<JsonValue>, Override<JsonValue>> {
    return new BroadcastChannelTransport({
      channel: this.#name,
      localEmit: true,
    });
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
