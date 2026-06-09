import { autoOpenHref, linkFor } from '../scan-link';
import type { ScanResult } from '../worker/rpc';

describe('linkFor', () => {
  describe('link rows', () => {
    it('links http and https URLs, opening a new tab', () => {
      expect(linkFor('link', 'https://example.com')).toEqual({
        href: 'https://example.com',
        newTab: true,
      });
      expect(linkFor('link', 'http://example.com/path?q=1#frag')).toEqual({
        href: 'http://example.com/path?q=1#frag',
        newTab: true,
      });
    });

    it('matches the scheme case-insensitively', () => {
      expect(linkFor('link', 'HTTPS://Example.com')).toEqual({
        href: 'HTTPS://Example.com',
        newTab: true,
      });
    });

    it('trims surrounding whitespace out of the href', () => {
      expect(linkFor('link', '  https://trim.me  ')).toEqual({
        href: 'https://trim.me',
        newTab: true,
      });
    });

    it('rejects a bare scheme with no destination', () => {
      expect(linkFor('link', 'https://')).toBeUndefined();
      expect(linkFor('link', 'http://')).toBeUndefined();
    });

    it('ignores schemes that have no business being a result link', () => {
      // rxing tagged the row `link`, but the safety check still rejects a
      // non-`http(s)` payload rather than trust the tag.
      expect(linkFor('link', 'ftp://host/file')).toBeUndefined();
      expect(linkFor('link', 'javascript:alert(1)')).toBeUndefined();
      expect(linkFor('link', 'data:text/html,hi')).toBeUndefined();
    });

    it('refuses deceptive userinfo URLs that impersonate a host', () => {
      // The visible prefix reads as `paypal.com`, but the browser would
      // navigate to `evil.example` — drop it to plain text instead.
      expect(
        linkFor('link', 'https://paypal.com@evil.example'),
      ).toBeUndefined();
      expect(linkFor('link', 'https://user:pass@example.com')).toBeUndefined();
    });
  });

  describe('email rows', () => {
    it('links the address as mailto, in place', () => {
      expect(linkFor('email', 'user@example.com')).toEqual({
        href: 'mailto:user@example.com',
        newTab: false,
      });
      expect(linkFor('email', 'first.last+tag@sub.example.co.uk')).toEqual({
        href: 'mailto:first.last+tag@sub.example.co.uk',
        newTab: false,
      });
    });

    it('falls back to plain text for a malformed address', () => {
      // A safety gate, not detection — rxing said it's an email, but an
      // oddly-shaped one shouldn't yield an injection-prone `mailto:`.
      expect(linkFor('email', 'not-an-email')).toBeUndefined();
      expect(linkFor('email', 'user @ example.com')).toBeUndefined();
    });
  });

  describe('phone rows', () => {
    it('links a plain run of digits as tel, in place', () => {
      expect(linkFor('phone', '5551234567')).toEqual({
        href: 'tel:5551234567',
        newTab: false,
      });
    });

    it('normalizes separators and preserves a leading +', () => {
      expect(linkFor('phone', '+1 (555) 123-4567')).toEqual({
        href: 'tel:+15551234567',
        newTab: false,
      });
    });

    it('collapses a stray duplicate + to a single leading one', () => {
      expect(linkFor('phone', '++15551234567')).toEqual({
        href: 'tel:+15551234567',
        newTab: false,
      });
    });

    it('falls back to plain text when no digits remain', () => {
      expect(linkFor('phone', '+')).toBeUndefined();
      expect(linkFor('phone', '')).toBeUndefined();
    });
  });

  describe('sms rows', () => {
    it('links the number as sms, in place', () => {
      expect(linkFor('sms', '5551234567')).toEqual({
        href: 'sms:5551234567',
        newTab: false,
      });
      expect(linkFor('sms', '+1 (555) 123-4567')).toEqual({
        href: 'sms:+15551234567',
        newTab: false,
      });
    });
  });

  describe('unlinkable rows', () => {
    it('renders text, geo, and dateTime as plain text', () => {
      // Even a value that *looks* link-ish stays plain when its row isn't
      // a linkable type — detection lives in the wasm layer, not here.
      expect(linkFor('text', 'https://example.com')).toBeUndefined();
      expect(linkFor('text', 'just some text')).toBeUndefined();
      expect(linkFor('geo', '40.446')).toBeUndefined();
      expect(linkFor('dateTime', '1700000000000')).toBeUndefined();
    });
  });
});

describe('autoOpenHref', () => {
  const urlScan = (details: ScanResult['details'], text = ''): ScanResult => ({
    text,
    format: 'QR_CODE',
    kind: 'url',
    details,
  });

  it('returns the parsed link row of a url scan', () => {
    expect(
      autoOpenHref(
        urlScan([{ type: 'link', label: 'URL', value: 'https://example.com' }]),
      ),
    ).toBe('https://example.com');
  });

  it('prefers the parsed link over the raw text', () => {
    // rxing normalizes a bare host into a schemed URI; the raw payload had
    // no scheme and would fail the safety check on its own.
    expect(
      autoOpenHref(
        urlScan(
          [{ type: 'link', label: 'URL', value: 'http://example.com' }],
          'example.com',
        ),
      ),
    ).toBe('http://example.com');
  });

  it('falls back to the raw text when there is no link row', () => {
    expect(autoOpenHref(urlScan([], 'https://fallback.example'))).toBe(
      'https://fallback.example',
    );
  });

  it('refuses to launch a dangerous payload', () => {
    expect(
      autoOpenHref(
        urlScan([{ type: 'link', label: 'URL', value: 'javascript:alert(1)' }]),
      ),
    ).toBeUndefined();
    expect(
      autoOpenHref(
        urlScan([{ type: 'link', label: 'URL', value: 'data:text/html,hi' }]),
      ),
    ).toBeUndefined();
    expect(
      autoOpenHref(
        urlScan([
          {
            type: 'link',
            label: 'URL',
            value: 'https://paypal.com@evil.example',
          },
        ]),
      ),
    ).toBeUndefined();
  });

  it('only auto-opens url scans, never a link buried in another kind', () => {
    // A contact card can carry a website, but its purpose isn't to send
    // you there — leave it for the result surface to render.
    const contactScan: ScanResult = {
      text: '',
      format: 'QR_CODE',
      kind: 'contact',
      details: [{ type: 'link', label: 'URL', value: 'https://example.com' }],
    };
    expect(autoOpenHref(contactScan)).toBeUndefined();
  });
});
