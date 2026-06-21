import type { MessageHandler, Transport, Unsubscribe } from './interface.ts';

/**
 * Wraps a {@link BroadcastChannel} as a {@link Transport} for fan-out,
 * same-origin events across browsing contexts (tabs, workers) on one named
 * channel. No per-send options and no responses — it's a pure pub/sub carrier,
 * so pair it with the transport's `send`/`onMessage` directly rather than RPC,
 * whose request/response model a broadcast can't fulfill.
 *
 * Owns its channel: construct it with a channel name, and {@link close} when
 * done — it detaches every handler and closes the channel. A `BroadcastChannel`
 * never delivers a message back to the instance that posted it, but *does*
 * deliver to sibling instances in the same context. So a publisher and a
 * subscriber in one tab must each construct their own transport to hear each
 * other.
 *
 * @example
 * ```ts
 * const transport = new BroadcastChannelTransport<Inbound, Outbound>('log-files');
 * transport.onMessage((event) => {});
 * transport.send(payload);
 * transport.close(); // detach handlers and close the channel
 * ```
 */
export class BroadcastChannelTransport<Inbound, Outbound> implements Transport<
  Inbound,
  Outbound
> {
  readonly #channel: BroadcastChannel;

  // Tracked so `close` can detach every handler, not just leave them dangling
  // on a closed channel.
  readonly #listeners = new Set<(event: MessageEvent) => void>();

  constructor(name: string) {
    this.#channel = new BroadcastChannel(name);
  }

  send(message: Outbound): void {
    this.#channel.postMessage(message);
  }

  onMessage(handler: MessageHandler<Inbound>): Unsubscribe {
    const listener = (event: MessageEvent): void => {
      handler(event.data as Inbound);
    };
    this.#channel.addEventListener('message', listener);
    this.#listeners.add(listener);
    return () => this.#detach(listener);
  }

  /** Detach every registered handler and close the underlying channel. */
  close(): void {
    for (const listener of this.#listeners) {
      this.#channel.removeEventListener('message', listener);
    }
    this.#listeners.clear();
    this.#channel.close();
  }

  #detach(listener: (event: MessageEvent) => void): void {
    if (!this.#listeners.delete(listener)) return;
    this.#channel.removeEventListener('message', listener);
  }
}
