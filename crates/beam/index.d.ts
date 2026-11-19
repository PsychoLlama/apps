/**
 * Public types for `@crate/beam`. Mirrors the `wasm-bindgen`
 * `--target web` output (`dist/beam.d.ts`), but is checked in so consumers
 * type-check without first running the wasm build, and so the loosely-typed
 * corners of the generated output (`Function`) can be narrowed. Keep in sync
 * with the `#[wasm_bindgen]` surface under `src/`.
 */

/**
 * This device, open: its database over the browser's store, and an endpoint
 * on the network bound under the database's key.
 *
 * A wasm object that owns memory the garbage collector can't see. Call
 * {@link Device.close} to leave cleanly, then {@link Device.free}.
 */
export interface Device extends Disposable {
  /**
   * The address peers dial to reach this device, as a hex string. Also its
   * identity in every group it belongs to. Stable for as long as the store
   * is: a device that loses its store comes back as someone else.
   */
  readonly id: string;

  /**
   * Leave the network and let go of the store, resolving once both are
   * done. Terminal: open another device to come back.
   */
  close(): Promise<void>;

  /** Release the wasm object. Reaching for it afterwards throws. */
  free(): void;
}

/** Where a {@link Device} comes from. */
export const Device: {
  /**
   * Open the device kept in the IndexedDB store called `store`, making it
   * if it isn't there, and bind an endpoint under its key.
   *
   * Doesn't wait for the network: what the device holds is usable offline.
   * `onRelayChange` is called with the home relay's URL whenever one
   * connects, and with `undefined` when none is.
   *
   * Rejects if the browser won't open the store, if another tab or worker
   * already has it open, or if the endpoint can't bind. {@link init} must
   * resolve before calling this.
   */
  open(
    store: string,
    onRelayChange: (homeRelay: string | undefined) => void,
  ): Promise<Device>;
};

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
