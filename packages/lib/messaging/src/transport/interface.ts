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
export interface Transport<
  Inbound,
  Outbound,
  Options = never,
> extends AsyncDisposable {
  // Declared as function-typed properties, not methods, on purpose: method
  // signatures are checked bivariantly, which would let a `Transport<…, never>`
  // pass where `Transport<…, Options>` is required and silently drop options.
  // Property syntax forces contravariant parameter checks, so `Options` is
  // sound — a transport must actually accept the options a consumer can send.

  /**
   * Send a message to the peer endpoint, honoring carrier-specific options.
   * Resolves once the carrier has accepted the message and rejects if it
   * couldn't — an unserializable payload, a closed socket, a request that
   * timed out. The rejection describes *this* message, not the channel:
   * a transport stays usable after one send fails, and a carrier that has
   * genuinely died reports it by failing every subsequent send.
   *
   * Implementations must hand messages to the carrier in call order, even
   * though the promises they return may settle out of order. Callers rely on
   * two `send`s issued back-to-back arriving in that order — awaiting the
   * first is about knowing it succeeded, never about sequencing the second.
   */
  send: (message: Outbound, options: Options) => Promise<void>;

  /**
   * Register a handler for inbound messages. Multiple handlers may be
   * registered; each receives every inbound message. Returns an
   * {@link Unsubscribe} that detaches this handler.
   *
   * Handlers are notified, not awaited — fan-out is the transport's job and
   * a slow handler must not stall its siblings or the read loop. A handler
   * that needs to do async work owns that work itself.
   */
  onMessage: (handler: MessageHandler<Inbound>) => Unsubscribe;

  /**
   * Release the transport: detach its handlers and, where the transport owns
   * its carrier, close that too. Required on every transport so a caller can
   * always bind one with `await using` and know it can't leak — tests should
   * lean on that rather than hand-rolled teardown.
   */
  [Symbol.asyncDispose]: () => Promise<void>;
}
