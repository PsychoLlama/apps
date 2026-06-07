/**
 * Resolve a decoded QR field value to a hyperlink. Value-based by design
 * — a heuristic keyed to the shape of the value, not to which parsed
 * field it came from — so a URL/email/phone is linked wherever it shows
 * up in the result.
 */

/** A parsed value resolved to an anchor target. */
export interface DetailLink {
  /** The `href` to navigate to. */
  href: string;
  /**
   * Whether to open in a new tab. Web links do (`target="_blank"` +
   * `rel="noopener noreferrer"`); `mailto:`/`tel:` don't, so the browser
   * hands them to the mail client or dialer in place.
   */
  newTab: boolean;
}

// A web link needs a scheme *and* a destination after it: bare `https://`
// is not somewhere to go. Only `http(s)` — never `javascript:`, `data:`,
// or other schemes that have no business being a result link.
const isWebLink = (value: string) => /^https?:\/\/\S/i.test(value);

// One `@`, a dot-bearing domain, and no whitespace. Conservative — it
// only has to be good enough to gate a `mailto:`.
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/**
 * Heuristic phone test. Deliberately conservative: it rejects values that
 * carry letters (VINs, "100 m" altitudes), a decimal point (geo
 * coordinates), or an ISO date (all-day calendar events) before counting
 * digits — each is otherwise digit-heavy enough to look dial-able. What
 * survives is a run of 7–15 digits, the E.164 range.
 *
 * It can't tell a bare 13-digit phone number from a bare ISBN; that's an
 * accepted limitation, and moot here since the scanner only reads QR
 * codes (ISBNs arrive on 1D barcodes).
 */
const isPhone = (value: string) => {
  if (/[a-z]/i.test(value)) return false;
  if (value.includes('.')) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

// Collapse a phone value to a dialable `tel:` target: digits only, with a
// single leading `+` preserved when it was written international. Folds
// away any stray separators (and duplicate `+`) the value carried.
const toTelHref = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return value.startsWith('+') ? `tel:+${digits}` : `tel:${digits}`;
};

/**
 * Resolve a value to a {@link DetailLink}, or `undefined` to render it as
 * plain text. The value is trimmed first, so surrounding whitespace never
 * defeats a match or leaks into the `href`.
 */
export const linkFor = (value: string): DetailLink | undefined => {
  const trimmed = value.trim();
  if (isWebLink(trimmed)) return { href: trimmed, newTab: true };
  if (isEmail(trimmed)) return { href: `mailto:${trimmed}`, newTab: false };
  if (isPhone(trimmed)) return { href: toTelHref(trimmed), newTab: false };
  return undefined;
};
