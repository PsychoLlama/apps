/**
 * Public types for `@lib/qr-scanner`. Mirrors the `wasm-bindgen`
 * `--target web` output (`dist/qr_scanner.d.ts`), but is checked in so
 * consumers type-check without first running the wasm build. Keep in
 * sync with the `#[wasm_bindgen]` surface in `src/lib.rs`.
 */

/** A successfully decoded barcode. */
export class Scan {
  private constructor();
  free(): void;
  /** The decoded payload as text (UTF-8, charset-decoded by rxing). */
  readonly text: string;
  /** The symbology rxing matched, e.g. `"QR_CODE"`. */
  readonly format: string;
}

/**
 * Convert a canvas `ImageData.data` RGBA buffer into the 8-bit
 * luminance buffer {@link decode} expects (`width × height` bytes).
 *
 * Accepts `Uint8ClampedArray` (the type of `ImageData.data`) as well as
 * `Uint8Array` — the wasm glue reads either byte-shaped array.
 */
export function rgba_to_luma(rgba: Uint8Array | Uint8ClampedArray): Uint8Array;

/**
 * Decode the first barcode in a `width × height` 8-bit luminance buffer.
 * Resolves to `undefined` when nothing decodes — the common "no code in
 * frame" case, not an error. `tryHarder` trades speed for a more
 * exhaustive scan; leave it off for live frames, on for stills.
 */
export function decode(
  luma: Uint8Array,
  width: number,
  height: number,
  tryHarder: boolean,
): Scan | undefined;

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
 * resolve before calling {@link decode} or {@link rgba_to_luma}.
 */
export default function init(
  module_or_path?:
    | { module_or_path: InitInput | Promise<InitInput> }
    | InitInput
    | Promise<InitInput>,
): Promise<unknown>;
