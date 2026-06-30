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
 * Bind an endpoint to n0's public relays and resolve once at least one
 * relay handshake completes. Rejects if binding fails. {@link init} must
 * resolve before calling this.
 */
export function connect(): Promise<Connection>;

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
