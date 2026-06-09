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
 * `Inbound`/`Outbound` describe the traffic in each direction from this
 * endpoint's perspective: `Inbound` is what this side receives, `Outbound`
 * is what it sends. The peer endpoint holds the mirror image
 * (`Transport<Outbound, Inbound>`).
 *
 * `Options` is the per-send option bag the carrier understands (e.g.
 * transferables). `send` always receives one, so a carrier can read it
 * unconditionally; a carrier that recognizes no options ignores the (empty)
 * bag. `Options` defaults to `never` — a plain transport's bag carries
 * nothing, so its second argument has no usable fields until a carrier widens
 * it. Callers pair a transport with a peer that carries the same `Options`.
 *
 * Adapters wrap a concrete carrier (a `MessagePort`, a worker, a socket)
 * behind this shape, so callers stay decoupled from the carrier, and may
 * narrow `Inbound`/`Outbound` to what their carrier can actually move.
 */
export interface Transport<Inbound, Outbound, Options = never> {
  // Declared as function-typed properties, not methods, on purpose: method
  // signatures are checked bivariantly, which would let a `Transport<…, never>`
  // pass where `Transport<…, Options>` is required and silently drop options.
  // Property syntax forces contravariant parameter checks, so `Options` is
  // sound — a transport must actually accept the options a consumer can send.

  /** Send a message to the peer endpoint, honoring carrier-specific options. */
  send: (message: Outbound, options: Options) => void;

  /**
   * Register a handler for inbound messages. Multiple handlers may be
   * registered; each receives every inbound message. Returns an
   * {@link Unsubscribe} that detaches this handler.
   */
  onMessage: (handler: MessageHandler<Inbound>) => Unsubscribe;
}

export * from './message-port.ts';
