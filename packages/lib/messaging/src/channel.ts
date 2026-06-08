/**
 * The minimal shape every message must satisfy. `type` is the
 * discriminant — it lets consumers narrow an inbound union down to a
 * single variant inside an `onMessage` handler (e.g. via `switch`).
 *
 * Both halves of a {@link Channel} are discriminated unions of types
 * extending this shape. `type` may be a number when a compact wire
 * encoding is wanted (the RPC layer does this).
 */
export interface Message {
  type: string | number;
}

/** Handler invoked for each message arriving on a {@link Channel}. */
export type MessageHandler<Inbound extends Message> = (
  message: Inbound,
) => void;

/**
 * A bidirectional, fully-typed message channel — the base interface every
 * adapter implements.
 *
 * The two type parameters are discriminated unions describing the traffic
 * in each direction from this endpoint's perspective: `Inbound` is what
 * this side receives, `Outbound` is what it sends. The peer endpoint holds
 * the mirror image (`Channel<Outbound, Inbound>`).
 *
 * Adapters wrap a concrete transport (a `MessageChannel` port, a worker,
 * etc.) behind this shape, so callers stay decoupled from the transport.
 */
export interface Channel<Inbound extends Message, Outbound extends Message> {
  /** Send a message to the peer endpoint. */
  send(message: Outbound): void;

  /**
   * Register a handler for inbound messages. Multiple handlers may be
   * registered; each receives every inbound message.
   */
  onMessage(handler: MessageHandler<Inbound>): void;
}
