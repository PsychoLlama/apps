import { linkFor } from '../scan-link';

describe('linkFor', () => {
  describe('web links', () => {
    it('links http and https URLs, opening a new tab', () => {
      expect(linkFor('https://example.com')).toEqual({
        href: 'https://example.com',
        newTab: true,
      });
      expect(linkFor('http://example.com/path?q=1#frag')).toEqual({
        href: 'http://example.com/path?q=1#frag',
        newTab: true,
      });
    });

    it('matches the scheme case-insensitively', () => {
      expect(linkFor('HTTPS://Example.com')).toEqual({
        href: 'HTTPS://Example.com',
        newTab: true,
      });
    });

    it('trims surrounding whitespace out of the href', () => {
      expect(linkFor('  https://trim.me  ')).toEqual({
        href: 'https://trim.me',
        newTab: true,
      });
    });

    it('rejects a bare scheme with no destination', () => {
      expect(linkFor('https://')).toBeUndefined();
      expect(linkFor('http://')).toBeUndefined();
    });

    it('ignores schemes that have no business being a result link', () => {
      expect(linkFor('ftp://host/file')).toBeUndefined();
      expect(linkFor('javascript:alert(1)')).toBeUndefined();
      expect(linkFor('data:text/html,hi')).toBeUndefined();
    });
  });

  describe('emails', () => {
    it('links a valid address as mailto, in place', () => {
      expect(linkFor('user@example.com')).toEqual({
        href: 'mailto:user@example.com',
        newTab: false,
      });
      expect(linkFor('first.last+tag@sub.example.co.uk')).toEqual({
        href: 'mailto:first.last+tag@sub.example.co.uk',
        newTab: false,
      });
    });

    it('rejects malformed addresses', () => {
      expect(linkFor('not-an-email')).toBeUndefined();
      expect(linkFor('@example.com')).toBeUndefined();
      expect(linkFor('user@@example.com')).toBeUndefined();
      expect(linkFor('user@example')).toBeUndefined(); // no TLD dot
      expect(linkFor('user @ example.com')).toBeUndefined(); // whitespace
    });
  });

  describe('phone numbers', () => {
    it('links a plain run of digits as tel, in place', () => {
      expect(linkFor('5551234567')).toEqual({
        href: 'tel:5551234567',
        newTab: false,
      });
    });

    it('normalizes separators and preserves a leading +', () => {
      expect(linkFor('+1 (555) 123-4567')).toEqual({
        href: 'tel:+15551234567',
        newTab: false,
      });
    });

    it('collapses a stray duplicate + to a single leading one', () => {
      expect(linkFor('++15551234567')).toEqual({
        href: 'tel:+15551234567',
        newTab: false,
      });
    });

    it('honors the 7–15 digit bounds', () => {
      expect(linkFor('1234567')).toEqual({
        href: 'tel:1234567',
        newTab: false,
      });
      expect(linkFor('123456')).toBeUndefined(); // 6 digits
      expect(linkFor('1234567890123456')).toBeUndefined(); // 16 digits
    });
  });

  describe('digit-heavy values that are not phone numbers', () => {
    it('skips geo coordinates (a decimal point)', () => {
      expect(linkFor('40.446')).toBeUndefined();
      expect(linkFor('-122.4194')).toBeUndefined();
    });

    it('skips ISO dates (all-day calendar events)', () => {
      expect(linkFor('2026-06-07')).toBeUndefined();
    });

    it('skips values carrying letters', () => {
      expect(linkFor('1HGCM82633A004352')).toBeUndefined(); // VIN
      expect(linkFor('100 m')).toBeUndefined(); // altitude
    });
  });

  describe('non-links', () => {
    it('returns undefined for plain text', () => {
      expect(linkFor('just some text')).toBeUndefined();
    });

    it('returns undefined for empty, whitespace, or a lone +', () => {
      expect(linkFor('')).toBeUndefined();
      expect(linkFor('   ')).toBeUndefined();
      expect(linkFor('+')).toBeUndefined();
    });
  });
});
