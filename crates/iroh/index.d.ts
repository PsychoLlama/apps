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
 * Hand it to {@link Relay.new} to connect under it. Nothing here touches
 * the network — two relays can run under two identities at once, and an
 * identity outlives every relay opened with it.
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
   * The public address peers dial to reach a relay running under this
   * identity, as a base32 string. Derived from the key, so it's readable
   * straight away — render a share link before, or without, ever
   * connecting.
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
 * Everything about a relay other than its identity. An options bag because
 * it's the part expected to grow — relay server selection being the
 * obvious next entry. The identity stays positional: `wasm-bindgen` can
 * only unwrap an exported class at an argument position, not one nested in
 * a plain object.
 */
export interface RelayOptions {
  /**
   * The protocols this relay speaks, keyed by ALPN. At least one is
   * required — an endpoint that declares none can neither accept nor dial.
   * Names are 1–255 bytes, the limit TLS itself imposes on an ALPN.
   *
   * The set is fixed when the relay is defined because iroh advertises it
   * at bind time.
   */
  protocols: Record<string, ProtocolOptions>;
}

/**
 * A relay membership: defined by the constructor, live after
 * {@link Relay.connect}, and torn down by {@link Relay.close} or by
 * releasing the handle.
 *
 * In the browser iroh is relay-only — no hole-punching — so this is the
 * one membership every {@link PeerConnection} rides over. This is the
 * network handle; a `PeerConnection` is a single peer on it.
 */
export class Relay {
  /**
   * Define a relay without connecting it. Validates the options and throws
   * on anything malformed — an empty protocol table, a name too long for
   * an ALPN, a message ceiling that isn't a sane byte count.
   *
   * Nothing here touches the network. Register listeners, then
   * {@link Relay.connect}. {@link init} must resolve before calling this.
   */
  constructor(identity: Identity, options: RelayOptions);
  free(): void;
  [Symbol.dispose](): void;
  /**
   * The address peers dial to reach this relay, as a base32 string. The
   * same value as the identity's, repeated so a holder of a relay needn't
   * carry the identity alongside it.
   */
  readonly endpointId: string;
  /**
   * The URL of the relay server currently carrying this connection, or
   * `undefined` if none has finished its handshake.
   */
  readonly homeRelay: string | undefined;
  /**
   * Bind the endpoint and join the relay network, resolving once at least
   * one relay handshake completes. This is a connection to the relay
   * network, not to a peer.
   *
   * Rejects if binding fails, or if this relay is already connecting,
   * connected, or closed — a relay is joined once, and a second membership
   * means a second `Relay`.
   */
  connect(): Promise<void>;
  /**
   * Watch the relay connection come and go, invoking `onChange` with the
   * home relay's URL, or `undefined` when there isn't one.
   *
   * Register it before {@link Relay.connect} to see the first connection
   * land; a listener added later hears about the next change, not the
   * state it walked in on.
   */
  onConnectionChange(
    onChange: (homeRelay: string | undefined) => void,
  ): Subscription;
  /**
   * Handle inbound peer connections, invoking `onPeer` with the protocol
   * that was negotiated and a live {@link PeerConnection}.
   *
   * This is the other side of a {@link Relay.dial}: retain the connection
   * to talk back over it, and close it when done. Every listener gets its
   * own handle to the same underlying connection, so one releasing its
   * handle doesn't cut the others off.
   *
   * A peer that dials in while nothing is listening is declined rather
   * than parked.
   */
  onPeerConnection(
    onPeer: (protocol: string, peer: PeerConnection) => void,
  ): Subscription;
  /**
   * Dial the peer named by `endpointId` on `protocol`, resolving with a
   * live {@link PeerConnection} once established.
   *
   * `endpointId` is a base32 identity string as produced by
   * {@link Identity.endpointId} — the value carried in a share link.
   * `protocol` must be one this relay declared. Rejects if the id is
   * malformed, the protocol wasn't declared, the relay isn't connected, or
   * the dial fails.
   */
  dial(endpointId: string, protocol: string): Promise<PeerConnection>;
  /**
   * Leave the relay network, resolving once the endpoint has finished
   * closing. Stops the accept loop and the connection watcher, and closes
   * every peer connection this relay was still holding.
   *
   * Terminal: a closed relay can't be reconnected. Releasing the handle
   * does the same thing without waiting for it to finish.
   */
  close(): Promise<void>;
}

/**
 * A live connection to a single peer, riding over the {@link Relay} it was
 * opened through. Produced by {@link Relay.dial} and handed to the
 * {@link Relay.onPeerConnection} listener — the same object either
 * direction, because who started a connection stops mattering once it's
 * up.
 *
 * Handles share the connection underneath: releasing one closes it only if
 * it was the last. Framing is the host's business — a message is whatever
 * bytes were sent.
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
   * re-reading the property.
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
