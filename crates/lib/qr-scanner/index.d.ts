/**
 * Public types for `@lib/qr-scanner`. Mirrors the `wasm-bindgen`
 * `--target web` output (`dist/qr_scanner.d.ts`), but is checked in so
 * consumers type-check without first running the wasm build. Keep in
 * sync with the `#[wasm_bindgen]` surface in `src/lib.rs`.
 */

/**
 * The kind of payload rxing's result parser recognized. `'text'` is the
 * fallback for opaque payloads and anything unclassified.
 */
export type ScanKind =
  | 'wifi'
  | 'url'
  | 'email'
  | 'sms'
  | 'geo'
  | 'tel'
  | 'calendar'
  | 'contact'
  | 'isbn'
  | 'vin'
  | 'product'
  | 'text';

/**
 * One label/value row of a decoded code's parsed details, e.g.
 * `{ label: 'Network', value: 'home-wifi' }`. Ready to render as a row in
 * a description list.
 */
export interface ParsedDetail {
  /** Human-readable field name, e.g. `'Password'`. */
  label: string;
  /** The field's value. */
  value: string;
}

/** A successfully decoded barcode. */
export class Scan {
  private constructor();
  free(): void;
  /** The decoded payload as text (UTF-8, charset-decoded by rxing). */
  readonly text: string;
  /** The symbology rxing matched, e.g. `"QR_CODE"`. */
  readonly format: string;
  /**
   * The kind of payload rxing's result parser recognized — drives how the
   * host labels and presents {@link Scan.details}.
   */
  readonly kind: ScanKind;
  /**
   * The parsed payload as an ordered list of label/value rows. Empty for
   * opaque text (`kind === 'text'`).
   */
  readonly details: ParsedDetail[];
}

/**
 * Decode the first barcode in a `width × height` canvas `ImageData.data`
 * RGBA buffer. Resolves to `undefined` when nothing decodes — the common
 * "no code in frame" case, not an error.
 *
 * The RGBA → luma conversion the readers need runs internally, so the
 * host hands over the raw frame bytes directly. Accepts `Uint8ClampedArray`
 * (the type of `ImageData.data`) as well as `Uint8Array` — the wasm glue
 * reads either byte-shaped array.
 */
export function decode(
  rgba: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
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
 * resolve before calling {@link decode}.
 */
export default function init(
  module_or_path?:
    | { module_or_path: InitInput | Promise<InitInput> }
    | InitInput
    | Promise<InitInput>,
): Promise<unknown>;
