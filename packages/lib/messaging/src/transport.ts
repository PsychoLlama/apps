/** Discards a handler registered via {@link Transport.onMessage}. */
export type Unsubscribe = () => void;

/** Handler invoked for each message arriving on a {@link Transport}. */
export type MessageHandler<Inbound> = (message: Inbound) => void;

/**
 * A bidirectional message transport — the base interface every adapter
 * implements. It makes no assumption about what flows over it: the payload
 * may be structured data, JSON, binary, or anything else. The transport
 * only describes the abstract send/receive contract.
 *
 * The two type parameters describe the traffic in each direction from this
 * endpoint's perspective: `Inbound` is what this side receives, `Outbound`
 * is what it sends. The peer endpoint holds the mirror image
 * (`Transport<Outbound, Inbound>`).
 *
 * Adapters wrap a concrete carrier (a `MessagePort`, a worker, a socket)
 * behind this shape, so callers stay decoupled from the carrier. Adapters
 * may extend it with carrier-specific capabilities behind a brand symbol
 * (see {@link TransferableTransport}) and may narrow `Inbound`/`Outbound`
 * to what their carrier can actually move.
 */
export interface Transport<Inbound, Outbound> {
  /** Send a message to the peer endpoint. */
  send(message: Outbound): void;

  /**
   * Register a handler for inbound messages. Multiple handlers may be
   * registered; each receives every inbound message. Returns an
   * {@link Unsubscribe} that detaches this handler.
   */
  onMessage(handler: MessageHandler<Inbound>): Unsubscribe;
}

export * from './message-port.ts';
