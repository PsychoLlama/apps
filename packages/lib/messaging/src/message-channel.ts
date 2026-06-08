import type { Channel, Message } from './channel.ts';

// Private brand. Only `asTransferable` can mint it, so a channel cannot
// claim transfer support it doesn't have.
const transferable = Symbol('@lib/messaging:transferable');

/**
 * Per-send options. A capability bag so the call signature can grow without
 * breaking — today only `transfer`.
 *
 * `transfer` lists {@link Transferable} objects to hand to the peer by
 * reference instead of by copy; transferred objects are neutered in the
 * sender. Only honored by a {@link TransferableChannel}.
 */
export interface SendOptions {
  transfer?: Transferable[];
}

/**
 * A {@link Channel} whose transport can move {@link Transferable} objects by
 * reference instead of copying them (e.g. `MessagePort.postMessage`'s
 * transfer list). `send` accepts {@link SendOptions} carrying the objects to
 * hand off.
 *
 * Detect support with {@link isTransferable} — `RPC` does this to route
 * transfer requests, falling back to plain `send` otherwise.
 */
export interface TransferableChannel<
  Inbound extends Message,
  Outbound extends Message,
> extends Channel<Inbound, Outbound> {
  readonly [transferable]: true;
  send(message: Outbound, options?: SendOptions): void;
}

/**
 * Brand a transfer-capable channel. Adapters whose transport supports
 * zero-copy transfer wrap their channel with this so consumers can detect
 * the capability via {@link isTransferable}.
 */
export const asTransferable = <
  Inbound extends Message,
  Outbound extends Message,
>(
  channel: Omit<TransferableChannel<Inbound, Outbound>, typeof transferable>,
): TransferableChannel<Inbound, Outbound> =>
  Object.assign(channel, { [transferable]: true as const });

/** Narrow a channel to {@link TransferableChannel} if it supports transfer. */
export const isTransferable = <
  Inbound extends Message,
  Outbound extends Message,
>(
  channel: Channel<Inbound, Outbound>,
): channel is TransferableChannel<Inbound, Outbound> => transferable in channel;

/**
 * The minimal `MessagePort`-shaped transport this adapter drives. A
 * `MessagePort`, `Worker`, or worker global scope all satisfy it.
 *
 * `start` is optional: ports require it before delivery begins (workers
 * don't expose it), so the adapter calls it when present.
 */
export interface MessageEndpoint {
  postMessage(message: unknown, transfer: Transferable[]): void;
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent) => void,
  ): void;
  start?(): void;
}

/**
 * Wrap a `MessagePort`-shaped endpoint as a {@link TransferableChannel}.
 * Supports zero-copy transfer via the endpoint's `postMessage` transfer
 * list.
 *
 * @example
 * ```ts
 * const { port1, port2 } = new MessageChannel();
 * const channel = fromMessagePort<Inbound, Outbound>(port1);
 * worker.postMessage({ port: port2 }, [port2]);
 * ```
 */
export const fromMessagePort = <
  Inbound extends Message,
  Outbound extends Message,
>(
  endpoint: MessageEndpoint,
): TransferableChannel<Inbound, Outbound> => {
  endpoint.start?.();

  return asTransferable<Inbound, Outbound>({
    send(message, options) {
      endpoint.postMessage(message, options?.transfer ?? []);
    },
    onMessage(handler) {
      endpoint.addEventListener('message', (event) => {
        handler(event.data as Inbound);
      });
    },
  });
};
