/**
 * Resolve a parsed detail row to a hyperlink. The row's `type` — assigned
 * by rxing's parser in the wasm layer, not guessed from the value's shape
 * — decides the scheme: `link` → the URL itself, `email` → `mailto:`,
 * `phone` → `tel:`, `sms` → `sms:`. Everything else (plain `text`, `geo`)
 * renders as text. The one judgment left to the host is the `link` safety
 * check: building an `href` the browser will navigate to is security
 * sensitive, so a declared URL still has to clear {@link webLinkHref}.
 */

import type { ParsedDetail, ParsedLinkDetail } from '@crate/qr-code';
import type { ScanResult } from './worker/rpc';

/** A parsed value resolved to an anchor target. */
export interface DetailLink {
  /** The `href` to navigate to. */
  href: string;
  /**
   * Whether to open in a new tab. Web links do (`target="_blank"` +
   * `rel="noopener noreferrer"`); `mailto:`/`tel:`/`sms:` don't, so the
   * browser hands them to the mail client, dialer, or messaging app in place.
   */
  newTab: boolean;
}

// Validate an `http(s)` value as a safe link target, returning it or
// `undefined`. rxing tags a row `link`, but a QR can still carry a hostile
// URL, so we re-parse (rather than trust the tag) to reject the cases that
// matter: non-`http(s)` schemes (`javascript:`, `data:`), a bare `https://`
// with no host, and — crucially — deceptive userinfo like
// `https://paypal.com@evil.example`, where the visible prefix impersonates
// a trusted host but the browser navigates to whatever follows the `@`.
// Those drop back to plain text.
const webLinkHref = (value: string): string | undefined => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
  if (url.username !== '' || url.password !== '') return undefined;
  if (url.hostname === '') return undefined;
  return value;
};

// One `@`, a dot-bearing domain, and no whitespace. A safety gate on the
// `mailto:` href, not detection — rxing already classified the value as an
// email; this only guards against an oddly-shaped one yielding a malformed
// or injection-prone link. Excludes `/` and `:` so userinfo can't sneak in.
const isEmail = (value: string) =>
  /^[^\s@/:]+@[^\s@/:]+\.[^\s@/:]+$/.test(value);

// Build a dialable `tel:`/`sms:` target: digits only, with a single
// leading `+` preserved when the number was written international. Folds
// away stray separators (and duplicate `+`). Returns `undefined` when no
// digits remain, so a junk value falls back to plain text.
const dialHref = (
  scheme: 'tel' | 'sms',
  value: string,
): DetailLink | undefined => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return undefined;
  const number = value.startsWith('+') ? `+${digits}` : digits;
  return { href: `${scheme}:${number}`, newTab: false };
};

/**
 * Resolve a detail row's `type` and `value` to a {@link DetailLink}, or
 * `undefined` to render it as plain text. The value is trimmed first, so
 * surrounding whitespace never defeats a match or leaks into the `href`.
 */
export const linkFor = (
  type: ParsedDetail['type'],
  value: string,
): DetailLink | undefined => {
  const trimmed = value.trim();
  switch (type) {
    case 'link': {
      const href = webLinkHref(trimmed);
      return href === undefined ? undefined : { href, newTab: true };
    }
    case 'email':
      return isEmail(trimmed)
        ? { href: `mailto:${trimmed}`, newTab: false }
        : undefined;
    case 'phone':
      return dialHref('tel', trimmed);
    case 'sms':
      return dialHref('sms', trimmed);
    default:
      // `text`, `geo`, and `dateTime` carry no link.
      return undefined;
  }
};

/**
 * The web URL to auto-launch for a recognized code, or `undefined` when
 * there's nothing safe to open. Gated to `url`-kind scans — a QR whose
 * whole purpose is a web link — so a URL buried in a contact or calendar
 * card never triggers an unprompted navigation. The candidate is the
 * parsed `link` row (rxing's `getURI()`, which may add a scheme the raw
 * payload omitted), falling back to the raw text, and it still has to
 * clear the same {@link linkFor} `link` safety check used to render it —
 * so a `javascript:`/`data:`/deceptive-userinfo payload is never launched.
 */
export const autoOpenHref = (result: ScanResult): string | undefined => {
  if (result.kind !== 'url') return undefined;
  const link = result.details.find(
    (detail): detail is ParsedLinkDetail => detail.type === 'link',
  );
  return linkFor('link', link?.value ?? result.text)?.href;
};
