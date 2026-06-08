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
 * One row of a decoded code's parsed details, ready to render in a
 * description list. A discriminated union on `type`, where the tag is the
 * *semantic kind of the value* — taken from the field rxing's parser
 * populated, not sniffed from the string. It tells the host how to resolve
 * the value to a link: `link` → the URL, `email` → `mailto:`, `phone` →
 * `tel:`, `sms` → `sms:`. `geo` is a hint only (rendered as plain text;
 * no `geo:` link). `dateTime` arrives as a raw epoch so the host formats
 * it with `Intl` in the viewer's locale and timezone. `text` is the
 * catch-all for opaque, unlinkable values.
 */
export type ParsedDetail =
  | ParsedTextDetail
  | ParsedLinkDetail
  | ParsedEmailDetail
  | ParsedPhoneDetail
  | ParsedSmsDetail
  | ParsedGeoDetail
  | ParsedDateTimeDetail;

/**
 * A label/value row whose value carries a semantic type. The shared shape
 * behind every variant but {@link ParsedDateTimeDetail}; the `type`
 * discriminant narrows it.
 */
interface LabeledValueDetail {
  /** Human-readable field name, e.g. `'Password'`. */
  label: string;
  /** The field's value. */
  value: string;
}

/** A plain, unlinkable value, e.g. `{ label: 'Network', value: 'home' }`. */
export interface ParsedTextDetail extends LabeledValueDetail {
  type: 'text';
}

/** A web URL. The host links it (`http(s)` only, after its own check). */
export interface ParsedLinkDetail extends LabeledValueDetail {
  type: 'link';
}

/** An email address. The host links it as `mailto:`. */
export interface ParsedEmailDetail extends LabeledValueDetail {
  type: 'email';
}

/** A phone number. The host links it as `tel:` (opens the dialer). */
export interface ParsedPhoneDetail extends LabeledValueDetail {
  type: 'phone';
}

/** An SMS-capable number. The host links it as `sms:` (opens messaging). */
export interface ParsedSmsDetail extends LabeledValueDetail {
  type: 'sms';
}

/**
 * A geographic coordinate. A semantic hint only — rendered as plain text,
 * not a (poorly-supported) `geo:` link.
 */
export interface ParsedGeoDetail extends LabeledValueDetail {
  type: 'geo';
}

/**
 * A timestamp row (e.g. a calendar event's start/end). Carries the raw
 * epoch for the host to format; never pre-rendered to a string.
 */
export interface ParsedDateTimeDetail {
  type: 'dateTime';
  /** Human-readable field name, e.g. `'Starts'`. */
  label: string;
  /** Epoch milliseconds, UTC. */
  epochMillis: number;
  /** Date-only event — format without a clock time. */
  allDay: boolean;
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
   * The parsed payload as an ordered list of {@link ParsedDetail} rows.
   * Empty for opaque text (`kind === 'text'`).
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
