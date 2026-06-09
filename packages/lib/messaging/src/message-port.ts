import type { MessageHandler, Transport, Unsubscribe } from './transport.ts';

// Private brand. Only `asTransferable` (or a class that sets it directly,
// like `MessagePortTransport`) can mint it, so a transport cannot claim
// transfer support it doesn't have.
const transferable = Symbol('@lib/messaging:transferable');

/**
 * Per-send options. A capability bag so the call signature can grow without
 * breaking — today only `transfer`.
 *
 * `transfer` lists {@link Transferable} objects to hand to the peer by
 * reference instead of by copy; transferred objects are neutered in the
 * sender. Only honored by a {@link TransferableTransport}.
 */
export interface SendOptions {
  transfer?: Transferable[];
}

/**
 * A {@link Transport} whose carrier can move {@link Transferable} objects by
 * reference instead of copying them (e.g. `MessagePort.postMessage`'s
 * transfer list). `send` accepts {@link SendOptions} carrying the objects to
 * hand off.
 *
 * Detect support with {@link isTransferable} — `RPC` does this to route
 * transfer requests, falling back to plain `send` otherwise.
 */
export interface TransferableTransport<Inbound, Outbound> extends Transport<
  Inbound,
  Outbound
> {
  readonly [transferable]: true;
  send(message: Outbound, options?: SendOptions): void;
}

/**
 * Brand a transfer-capable transport. Custom transports whose carrier
 * supports zero-copy transfer wrap themselves with this so consumers can
 * detect the capability via {@link isTransferable}. (The brand symbol is
 * private, so this is the only way to mint one from outside this module.)
 */
export const asTransferable = <Inbound, Outbound>(
  transport: Omit<
    TransferableTransport<Inbound, Outbound>,
    typeof transferable
  >,
): TransferableTransport<Inbound, Outbound> =>
  Object.assign(transport, { [transferable]: true as const });

/** Narrow a transport to {@link TransferableTransport} if it supports transfer. */
export const isTransferable = <Inbound, Outbound>(
  transport: Transport<Inbound, Outbound>,
): transport is TransferableTransport<Inbound, Outbound> =>
  transferable in transport;

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
 * Wraps a `MessagePort`-shaped endpoint as a {@link TransferableTransport}.
 * Supports zero-copy transfer via the endpoint's `postMessage` transfer
 * list.
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
export class MessagePortTransport<
  Inbound,
  Outbound,
> implements TransferableTransport<Inbound, Outbound> {
  readonly [transferable] = true as const;
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
