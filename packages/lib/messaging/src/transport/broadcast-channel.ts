import type { MessageHandler, Transport, Unsubscribe } from './interface.ts';

/**
 * The minimal `BroadcastChannel`-shaped carrier
 * {@link BroadcastChannelTransport} drives. A `BroadcastChannel` satisfies it.
 *
 * Unlike {@link MessageEndpoint}, `postMessage` takes no transfer list:
 * `BroadcastChannel` clones its payload and carries no transferables, so the
 * transport exposes no per-send options.
 */
export interface BroadcastEndpoint {
  postMessage(message: unknown): void;
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent) => void,
  ): void;
  removeEventListener(
    type: 'message',
    listener: (event: MessageEvent) => void,
  ): void;
}

/**
 * Wraps a `BroadcastChannel`-shaped endpoint as a {@link Transport} for
 * fan-out, same-origin events across browsing contexts (tabs, workers) on one
 * named channel. No per-send options and no responses — it's a pure pub/sub
 * carrier, so pair it with the transport's `send`/`onMessage` directly rather
 * than RPC, whose request/response model a broadcast can't fulfill.
 *
 * A `BroadcastChannel` never delivers a message back to the instance that
 * posted it, but *does* deliver to sibling instances in the same context. So a
 * publisher and a subscriber in one tab must hold separate channels to hear
 * each other — the publisher posts on its own, the subscriber listens on its
 * own.
 *
 * @example
 * ```ts
 * const channel = new BroadcastChannel('log-files');
 * const transport = new BroadcastChannelTransport<Inbound, Outbound>(channel);
 * transport.onMessage((event) => {});
 * transport.send(payload);
 * channel.close(); // the consumer owns the channel's lifetime
 * ```
 */
export class BroadcastChannelTransport<Inbound, Outbound> implements Transport<
  Inbound,
  Outbound
> {
  readonly #endpoint: BroadcastEndpoint;

  constructor(endpoint: BroadcastEndpoint) {
    this.#endpoint = endpoint;
  }

  send(message: Outbound): void {
    this.#endpoint.postMessage(message);
  }

  onMessage(handler: MessageHandler<Inbound>): Unsubscribe {
    const listener = (event: MessageEvent): void => {
      handler(event.data as Inbound);
    };
    this.#endpoint.addEventListener('message', listener);
    return () => this.#endpoint.removeEventListener('message', listener);
  }
}
