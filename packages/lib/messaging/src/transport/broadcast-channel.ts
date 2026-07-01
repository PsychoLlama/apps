import type { MessageHandler, Transport, Unsubscribe } from './interface.ts';

/** Configuration for a {@link BroadcastChannelTransport}. */
export interface BroadcastChannelConfig {
  /** Name of the same-origin {@link BroadcastChannel} to open. */
  channel: string;

  /**
   * Echo each {@link BroadcastChannelTransport.send} back to this instance's own
   * handlers. A `BroadcastChannel` withholds every post from the instance that
   * sent it — delivering only to siblings — so by default a lone transport
   * never hears itself, and a publisher and subscriber in one context must each
   * hold their own instance. Turn this on and a single transport both publishes
   * and observes its own writes, no sibling required. Off by default.
   */
  localEmit?: boolean;
}

/**
 * Wraps a {@link BroadcastChannel} as a {@link Transport} for fan-out,
 * same-origin events across browsing contexts (tabs, workers) on one named
 * channel. No per-send options and no responses — it's a pure pub/sub carrier,
 * so pair it with the transport's `send`/`onMessage` directly rather than RPC,
 * whose request/response model a broadcast can't fulfill.
 *
 * Owns its channel: construct it with a {@link BroadcastChannelConfig} and
 * {@link close} when done. By default a `BroadcastChannel` never delivers a
 * message back to the instance that posted it, only to sibling instances — so
 * a publisher and a subscriber in one context each need their own transport to
 * hear each other. Set {@link BroadcastChannelConfig.localEmit} to fold both
 * roles into one instance: `send` then also replays to this transport's own
 * handlers.
 *
 * @example
 * ```ts
 * const transport = new BroadcastChannelTransport<Inbound, Outbound>({
 *   channel: 'log-files',
 * });
 * transport.onMessage((event) => {});
 * transport.send(payload);
 * transport.close(); // close the channel; a BroadcastChannel can't be reopened
 * ```
 */
export class BroadcastChannelTransport<Inbound, Outbound> implements Transport<
  Inbound,
  Outbound
> {
  readonly #channel: BroadcastChannel;
  readonly #localEmit: boolean;

  // The self-emit fan-out, populated only while `localEmit` is on: one entry
  // per live handler, invoked directly on a local `send`. The remote path needs
  // no such registry — it rides the channel's own listeners, and closing the
  // channel stops delivery, so there's nothing to detach there.
  readonly #localHandlers = new Set<(message: Inbound) => void>();

  constructor(config: BroadcastChannelConfig) {
    this.#channel = new BroadcastChannel(config.channel);
    this.#localEmit = config.localEmit ?? false;
  }

  send(message: Outbound): void {
    this.#channel.postMessage(message);

    // A channel never echoes a sender its own post, so `localEmit` replays it to
    // local handlers by hand. It fires synchronously here, ahead of the async
    // sibling delivery. A self-send is one this instance would also receive, so
    // Outbound stands in for Inbound.
    if (this.#localEmit) {
      for (const emit of this.#localHandlers) {
        emit(message as unknown as Inbound);
      }
    }
  }

  onMessage(handler: MessageHandler<Inbound>): Unsubscribe {
    const listener = (event: MessageEvent): void => {
      handler(event.data as Inbound);
    };
    this.#channel.addEventListener('message', listener);

    // A distinct closure per registration so duplicate handlers each unsubscribe
    // independently, mirroring the remote path's per-listener detach.
    const emit = (message: Inbound): void => handler(message);
    if (this.#localEmit) this.#localHandlers.add(emit);

    return () => {
      this.#channel.removeEventListener('message', listener);
      this.#localHandlers.delete(emit);
    };
  }

  /**
   * Close the underlying channel and drop the self-emit handlers. A closed
   * `BroadcastChannel` receives no further posts, so the remote path needs no
   * per-handler detach — the dead channel and its listeners are collected
   * together — while clearing the local set ends the self-emit path. A
   * `BroadcastChannel` can't be reopened; build a new transport to resume.
   */
  close(): void {
    this.#channel.close();
    this.#localHandlers.clear();
  }
}
