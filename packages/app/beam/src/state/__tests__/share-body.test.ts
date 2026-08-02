/**
 * Unit tests for what a share body is allowed to be, and what counts as a
 * link. Pure text rules, applied at every edge a body crosses — the wire
 * decodes against them and the fold normalizes with them.
 */

import { normalizeShare, shareLink, SHARE_MAX_LENGTH } from '../share-body';

describe('normalizeShare', () => {
  it('keeps the shape text arrived with', () => {
    // A pasted address or a snippet of code is unreadable as one long line,
    // so unlike a name this keeps its newlines.
    expect(normalizeShare('line one\nline two')).toBe('line one\nline two');
  });

  it('leaves a Windows line ending as one break', () => {
    expect(normalizeShare('one\r\ntwo')).toBe('one\ntwo');
  });

  it('drops control characters that are not layout', () => {
    expect(normalizeShare('safe\u0000\u0007text')).toBe('safetext');
  });

  it('trims the ends', () => {
    expect(normalizeShare('  hello  ')).toBe('hello');
  });

  it('reads whitespace as nothing at all', () => {
    expect(normalizeShare('   \n\t ')).toBeNull();
    expect(normalizeShare('')).toBeNull();
  });

  it('caps an overlong body without a ragged edge', () => {
    const body = `${'a'.repeat(SHARE_MAX_LENGTH)} tail`;

    // The cut can land mid-space, and a body shouldn't end in one.
    expect(normalizeShare(body)).toBe('a'.repeat(SHARE_MAX_LENGTH));
  });
});

describe('shareLink', () => {
  it('recognizes a body that is entirely a URL', () => {
    expect(shareLink('https://example.com/path')).toBe(
      'https://example.com/path',
    );
    expect(shareLink('http://example.com/')).toBe('http://example.com/');
  });

  it('refuses a scheme that is not ordinary navigation', () => {
    // An Open button on one of these runs a peer's choice of code on this
    // origin. The allowlist is the point, not tidiness.
    expect(shareLink('javascript:alert(1)')).toBeNull();
    expect(shareLink('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(shareLink('file:///etc/passwd')).toBeNull();
  });

  it('refuses a sentence with a link in it', () => {
    // Picking the URL out would mean guessing where it ends.
    expect(shareLink('look at https://example.com')).toBeNull();
  });

  it('refuses text that is not a URL', () => {
    expect(shareLink('kettle is on')).toBeNull();
  });
});
