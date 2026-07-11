/**
 * Public types for `@crate/iroh`. Mirrors the `wasm-bindgen`
 * `--target web` output (`dist/iroh_share.d.ts`), but is checked in so
 * consumers type-check without first running the wasm build. Keep in
 * sync with the `#[wasm_bindgen]` surface in `src/lib.rs`.
 */

/**
 * A live endpoint joined to the iroh relay network. In the browser iroh is
 * relay-only, so this is the one membership every {@link PeerConnection}
 * rides over; holding it keeps the relay connection open, freeing it tears
 * the endpoint down.
 */
export class Relay {
  private constructor();
  free(): void;
  /**
   * This endpoint's public identity, as a base32 string — the address a
   * peer dials to reach us.
   */
  readonly endpointId: string;
  /**
   * The URL of the relay we're currently connected through, or
   * `undefined` if none has finished its handshake yet.
   */
  readonly homeRelay: string | undefined;
  /**
   * Dial the peer named by `endpoint_id` over the relay on the
   * test-connection ALPN. `endpoint_id` is a base32 identity string as
   * produced by {@link Relay.endpointId} — the value carried in a share
   * link.
   * Resolves with a live {@link PeerConnection} once established; rejects if
   * the id is malformed or the dial fails.
   */
  dial(endpoint_id: string): Promise<PeerConnection>;
  /**
   * Start accepting inbound peer connections, invoking `on_peer` with a
   * {@link PeerConnection} for each connecting peer. This is how a dialled
   * endpoint observes the other side of a {@link Relay.dial}. Calling it
   * again replaces the running loop. The loop stops when this `Relay` is
   * freed. The loop holds each connection open itself, so the callback may
   * free its handle without closing the connection.
   */
  acceptPeers(on_peer: (peer: PeerConnection) => void): void;
}

/**
 * A live connection to a single peer, riding over the {@link Relay} it was
 * opened through. Produced by {@link Relay.dial} and handed to the
 * {@link Relay.acceptPeers} callback. Holding it keeps the peer connection
 * open; freeing it closes it.
 */
export class PeerConnection {
  private constructor();
  free(): void;
  /**
   * The connected peer's public identity, as a base32 string — the same
   * value it advertises as its {@link Relay.endpointId}.
   */
  readonly remoteId: string;
}

/**
 * Mint a fresh endpoint identity, returning its secret key as the raw 32
 * bytes. Persist it and hand it to {@link joinRelay} to keep a stable
 * identity (and share link) across reloads. Treat it as a secret.
 * Generating the key here — rather than deriving it inside
 * {@link joinRelay} — lets the host persist and connect in parallel.
 * {@link init} must resolve before calling this.
 */
export function generateSecretKey(): Uint8Array;

/**
 * Bind an endpoint under the given identity and join n0's public relay
 * network, resolving once at least one relay handshake completes. This is
 * a connection to the relay network, not to a peer. {@link init} must
 * resolve before calling this.
 *
 * `secret_key` is the raw 32 bytes from {@link generateSecretKey} (or a
 * previously persisted one). Rejects if the key is malformed or binding
 * fails.
 */
export function joinRelay(secret_key: Uint8Array): Promise<Relay>;

/** Bytes or a compiled module to instantiate the wasm from. */
export type InitInput =
  RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

/**
 * Instantiate the module. With no argument the glue fetches the sibling
 * `.wasm`; pass bytes/a module/URL to control loading yourself. Must
 * resolve before calling {@link joinRelay}.
 */
export default function init(
  module_or_path?:
    | { module_or_path: InitInput | Promise<InitInput> }
    | InitInput
    | Promise<InitInput>,
): Promise<unknown>;
