/**
 * Public types for `@crate/iroh`. Mirrors the `wasm-bindgen`
 * `--target web` output (`dist/iroh_share.d.ts`), but is checked in so
 * consumers type-check without first running the wasm build. Keep in
 * sync with the `#[wasm_bindgen]` surface in `src/lib.rs`.
 */

/** A live endpoint joined to the iroh relay network. */
export class Connection {
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
export function joinRelay(secret_key: Uint8Array): Promise<Connection>;

/** Bytes or a compiled module to instantiate the wasm from. */
export type InitInput =
  | RequestInfo
  | URL
  | Response
  | BufferSource
  | WebAssembly.Module;

/**
 * Instantiate the module. With no argument the glue fetches the sibling
 * `.wasm`; pass bytes/a module/URL to control loading yourself. Must
 * resolve before calling {@link connect}.
 */
export default function init(
  module_or_path?:
    | { module_or_path: InitInput | Promise<InitInput> }
    | InitInput
    | Promise<InitInput>,
): Promise<unknown>;
