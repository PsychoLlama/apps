/**
 * Public types for `@crate/iroh`. Mirrors the `wasm-bindgen`
 * `--target web` output (`dist/iroh_share.d.ts`), but is checked in so
 * consumers type-check without first running the wasm build, and so the
 * loosely-typed corners of the generated output (`Function`,
 * `Promise<any>`) can be narrowed. Keep in sync with the
 * `#[wasm_bindgen]` surface in `src/lib.rs`.
 *
 * Every handle here is a wasm object that must be released.
 * `wasm-bindgen` aliases `Symbol.dispose` to `free`, so `using` works
 * throughout and is the recommended way to hold one:
 *
 * ```ts
 * using identity = Identity.create();
 * ```
 */

/**
 * A registered listener, live until this handle is released.
 *
 * Releasing it — `unsubscribe()`, `free()`, or leaving a `using` scope —
 * stops delivery. Letting it go out of scope unreferenced does too, but
 * only whenever the engine gets around to collecting it, so say so
 * explicitly if it matters when delivery stops.
 */
export class Subscription {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Stop delivering to this listener. Consumes the handle, which is the
   * same thing releasing it does.
   */
  unsubscribe(): void;
}

/**
 * An endpoint's identity: its secret key, and the public address that key
 * implies.
 *
 * Hand it to {@link Endpoint.new} to run under it. Nothing here touches the
 * network — two endpoints can run under two identities at once, and an
 * identity outlives every endpoint opened with it.
 */
export class Identity {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Mint a fresh identity. Persist {@link Identity.secretKey} to keep the
   * same address across reloads; an identity that isn't saved is gone when
   * the page is. {@link init} must resolve before calling this.
   */
  static create(): Identity;
  /**
   * Restore a previously persisted identity from the raw 32 bytes of
   * {@link Identity.secretKey}. Throws if that isn't what it got.
   * {@link init} must resolve before calling this.
   */
  static from(bytes: Uint8Array): Identity;
  /**
   * The public address peers dial to reach an endpoint running under this
   * identity, as a base32 string. Derived from the key, so it's readable
   * straight away — render a share link before, or without, ever joining.
   */
  readonly endpointId: string;
  /**
   * The raw 32 bytes of the secret key, for persisting. Treat it as a
   * secret: anyone holding it can be this endpoint.
   */
  readonly secretKey: Uint8Array;
}

/** Terms one protocol is spoken on. */
export interface ProtocolOptions {
  /**
   * Largest inbound message that will be read off a stream, in bytes. A
   * whole number between 1 and 67108864 (64 MiB).
   *
   * This is the ceiling on what an unauthenticated peer can make the
   * browser buffer, so there is deliberately no unbounded setting.
   * Outbound messages are checked against it too, turning a silent drop at
   * the far end into a rejected {@link PeerConnection.send} at this one.
   */
  maxMessageSize: number;
}

/**
 * Everything about an endpoint other than its identity: the protocols it
 * speaks and the handlers it runs. An options bag because it's the part
 * expected to grow — relay server selection being the obvious next entry.
 * The identity stays positional: `wasm-bindgen` can only unwrap an exported
 * class at an argument position, not one nested in a plain object.
 */
export interface EndpointOptions {
  /**
   * The protocols this endpoint speaks, keyed by ALPN. At least one is
   * required — an endpoint that declares none can neither accept nor dial.
   * Names are 1–255 bytes, the limit TLS itself imposes on an ALPN.
   *
   * The set is fixed when the endpoint is defined because iroh advertises
   * it at bind time.
   */
  protocols: Record<string, ProtocolOptions>;

  /**
   * Handle inbound peer connections, called with the protocol that was
   * negotiated and a live {@link PeerConnection}. This is the other side of
   * an {@link Endpoint.dial}: retain the connection to talk back over it,
   * and close it when done.
   *
   * Required, and required *here* rather than as a method, so there is no
   * moment when an endpoint is reachable and nothing is listening. A peer
   * arriving in that window would have to be turned away, which is
   * invisible to this side and nearly invisible to the dialer — it sees a
   * connection come up and then close for no stated reason. Settling the
   * handler when the endpoint is defined means the window cannot exist.
   *
   * One handler, and no unsubscribing: it lives exactly as long as the
   * endpoint does.
   */
  onPeerConnection: (protocol: string, peer: PeerConnection) => void;

  /**
   * Watch the relay connection come and go, called with the home relay's
   * URL — or `undefined` when there isn't one. Fires for the first
   * connection too, since it's in place before {@link Endpoint.join} binds
   * anything.
   *
   * Optional, unlike {@link EndpointOptions.onPeerConnection}: a missed
   * status change costs nothing, because {@link Endpoint.homeRelay} reports
   * the current state on demand. Omitting it means no watcher runs at all.
   *
   * One handler, and no unsubscribing: it lives exactly as long as the
   * endpoint does.
   */
  onConnectionChange?: (homeRelay: string | undefined) => void;
}

/**
 * This device on the network: defined by {@link Endpoint.new}, live after
 * {@link Endpoint.join}, and torn down by {@link Endpoint.leave} or by
 * releasing the handle.
 *
 * In the browser iroh is relay-only — no hole-punching — so this is the
 * one membership every {@link PeerConnection} rides over. This is the
 * network handle; a `PeerConnection` is a single peer reached through it.
 * The relay server carrying the traffic is {@link Endpoint.homeRelay}, and
 * is not this.
 */
export class Endpoint {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Define an endpoint without joining the network. Validates the options
   * and throws on anything malformed — an empty protocol table, a name too
   * long for an ALPN, a message ceiling that isn't a sane byte count, a
   * missing `onPeerConnection`, an `onConnectionChange` that isn't a
   * function.
   *
   * Nothing here touches the network — call {@link Endpoint.join} next.
   * {@link init} must resolve before calling this.
   */
  // A static factory named `new`, not a construct signature. The rule
  // guards against `new(): T` written where a constructor was meant; this
  // mirrors the `Endpoint::new` the crate exports.
  // eslint-disable-next-line @typescript-eslint/no-misused-new
  static new(identity: Identity, options: EndpointOptions): Endpoint;
  /**
   * The address peers dial to reach this endpoint, as a base32 string —
   * what {@link Identity.endpointId} names. The same value as the
   * identity's, repeated so a holder of an endpoint needn't carry the
   * identity alongside it.
   */
  readonly id: string;
  /**
   * The URL of the relay server currently carrying this connection, or
   * `undefined` if none has finished its handshake.
   */
  readonly homeRelay: string | undefined;
  /**
   * Bind and join the relay network, resolving once at least one relay
   * handshake completes. This joins the network; it does not connect to a
   * peer — {@link Endpoint.dial} does that.
   *
   * Rejects if binding fails, or if this endpoint is already joining,
   * joined, or gone — an endpoint joins once, and a second membership means
   * a second `Endpoint`.
   */
  join(): Promise<void>;
  /**
   * Dial the peer named by `endpointId` on `protocol`, resolving with a
   * live {@link PeerConnection} once established.
   *
   * `endpointId` is a base32 identity string as produced by
   * {@link Identity.endpointId} — the value carried in a share link.
   * `protocol` must be one this endpoint declared. Rejects if the id is
   * malformed, the protocol wasn't declared, the endpoint hasn't joined, or
   * the dial fails.
   */
  dial(endpointId: string, protocol: string): Promise<PeerConnection>;
  /**
   * Leave the relay network, resolving once the endpoint has finished
   * closing. Stops the accept loop and the connection watcher, and closes
   * every peer connection this endpoint was still holding.
   *
   * Terminal: an endpoint that has left can't rejoin. Releasing the handle
   * does the same thing without waiting for it to finish.
   */
  leave(): Promise<void>;
}

/**
 * A live connection to a single peer, riding over the {@link Endpoint} it
 * was opened through. Produced by {@link Endpoint.dial} and handed to the
 * endpoint's `onPeerConnection` handler — the same object either direction,
 * because who started a connection stops mattering once it's up.
 *
 * Exactly one handle exists per connection, so releasing it closes the
 * connection. Framing is the host's business — a message is whatever bytes
 * were sent.
 */
export class PeerConnection {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * The connected peer's public identity, as a base32 string — the same
   * value it advertises as its {@link Identity.endpointId}.
   */
  readonly endpointId: string;
  /** The protocol this connection was opened on. */
  readonly protocol: string;
  /**
   * Send one message to the peer, resolving once it has been written.
   * Rejects if the connection is gone, or if the message exceeds the
   * protocol's {@link ProtocolOptions.maxMessageSize}.
   *
   * Each message rides its own stream, so messages are ordered only within
   * themselves — two sends can land out of order.
   */
  send(message: Uint8Array): Promise<void>;
  /**
   * Start reading inbound messages, invoking `onMessage` with each one.
   *
   * The read loop starts with the first listener and stays up for the life
   * of the connection, so messages arriving while nothing is subscribed
   * are read and discarded rather than queued. Oversized or failed streams
   * are dropped individually rather than ending the loop.
   */
  onMessage(onMessage: (message: Uint8Array) => void): Subscription;
  /**
   * Close the connection, telling the peer it was deliberate. Returns
   * immediately — QUIC sends the close frame best-effort and there is
   * nothing to flush. Await {@link PeerConnection.closed} to know when it
   * has actually finished.
   */
  close(): void;
  /**
   * Resolves when the connection ends, with the reason it ended — whether
   * that's this side calling {@link PeerConnection.close}, the peer doing
   * so, or the transport failing.
   *
   * Each read starts its own wait, so hold onto the promise rather than
   * re-reading the property. A pending wait doesn't keep the connection
   * alive: releasing the handle closes it, and closing it is what settles
   * every outstanding wait.
   */
  readonly closed: Promise<string>;
}

/** Bytes or a compiled module to instantiate the wasm from. */
export type InitInput =
  RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

/**
 * Instantiate the module. With no argument the glue fetches the sibling
 * `.wasm`; pass bytes/a module/URL to control loading yourself. Must
 * resolve before anything else here is called.
 */
export default function init(
  module_or_path?:
    | { module_or_path: InitInput | Promise<InitInput> }
    | InitInput
    | Promise<InitInput>,
): Promise<unknown>;
