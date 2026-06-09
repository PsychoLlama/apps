import type { MessageHandler, Transport, Unsubscribe } from './transport.ts';

/**
 * Per-send options. A capability bag so the call signature can grow without
 * breaking — today only `transfer`.
 *
 * `transfer` lists {@link Transferable} objects to hand to the peer by
 * reference instead of by copy; transferred objects are neutered in the
 * sender. Only honored by a {@link MessagePortTransport}.
 */
export interface SendOptions {
  transfer?: Transferable[];
}

/**
 * The minimal `MessagePort`-shaped carrier {@link MessagePortTransport}
 * drives. A `MessagePort`, `Worker`, or worker global scope all satisfy it.
 */
export interface MessageEndpoint {
  postMessage(message: unknown, transfer: Transferable[]): void;
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
 * Wraps a `MessagePort`-shaped endpoint as a {@link Transport}. Supports
 * zero-copy transfer via the endpoint's `postMessage` transfer list — pass
 * {@link SendOptions} to {@link MessagePortTransport.send}. Consumers that
 * need to branch on this capability can test with `instanceof`.
 *
 * Listens via `addEventListener`, so a `MessagePort` delivers nothing until
 * the caller `start()`s it — starting is the consumer's to time, not this
 * transport's. (`Worker` endpoints deliver without starting.)
 *
 * @example
 * ```ts
 * const { port1, port2 } = new MessageChannel();
 * const transport = new MessagePortTransport<Inbound, Outbound>(port1);
 * port1.start(); // begin delivery when ready
 * worker.postMessage({ port: port2 }, [port2]);
 * ```
 */
export class MessagePortTransport<Inbound, Outbound> implements Transport<
  Inbound,
  Outbound
> {
  readonly #endpoint: MessageEndpoint;

  constructor(endpoint: MessageEndpoint) {
    this.#endpoint = endpoint;
  }

  send(message: Outbound, options?: SendOptions): void {
    this.#endpoint.postMessage(message, options?.transfer ?? []);
  }

  onMessage(handler: MessageHandler<Inbound>): Unsubscribe {
    const listener = (event: MessageEvent): void => {
      handler(event.data as Inbound);
    };
    this.#endpoint.addEventListener('message', listener);
    return () => this.#endpoint.removeEventListener('message', listener);
  }
}
