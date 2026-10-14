import { match } from '../match.ts';
import { parse } from '../parse.ts';

const test = (pattern: string, url: string) =>
  match(parse(pattern), new URL(url, 'https://example.com'));

describe('match', () => {
  describe('static paths', () => {
    it('matches the exact path', () => {
      expect(test('/about', '/about')).toEqual({});
    });

    it('is case-sensitive', () => {
      expect(test('/about', '/About')).toBeNull();
    });

    it('treats a trailing slash as significant', () => {
      expect(test('/about', '/about/')).toBeNull();
      expect(test('/about/', '/about')).toBeNull();
    });

    it('ignores the query string', () => {
      expect(test('/about', '/about?q=1')).toEqual({});
    });

    it('treats regex metacharacters literally', () => {
      expect(test('/a+b(c).d', '/a+b(c).d')).toEqual({});
      expect(test('/a+b(c).d', '/aab(c)xd')).toBeNull();
    });
  });

  describe('placeholders', () => {
    it('captures one path segment', () => {
      expect(test('/posts/:id', '/posts/abc')).toEqual({ id: 'abc' });
    });

    it('does not match an empty segment', () => {
      expect(test('/posts/:id', '/posts/')).toBeNull();
    });

    it('does not cross a slash', () => {
      expect(test('/posts/:id', '/posts/a/b')).toBeNull();
      expect(test('/posts/:id', '/posts/abc/')).toBeNull();
    });

    it('captures several segments', () => {
      expect(test('/:a/:b', '/one/two')).toEqual({ a: 'one', b: 'two' });
    });

    it('matches part of a segment', () => {
      expect(test('/pre-:name.ext', '/pre-abc.ext')).toEqual({ name: 'abc' });
      expect(test('/pre-:name.ext', '/pre-a-b.ext')).toEqual({ name: 'a-b' });
      expect(test('/pre-:name.ext', '/pre-a.b.ext')).toEqual({ name: 'a.b' });
    });

    it('does not match the literal text around it loosely', () => {
      expect(test('/pre-:name.ext', '/pre-.ext')).toBeNull();
      expect(test('/pre-:name.ext', '/pre-abcXext')).toBeNull();
      expect(test('/pre-:name.ext', '/pre-a/b.ext')).toBeNull();
    });

    it('ends its name at the first non-word character', () => {
      expect(test('/:x+(y)', '/q+(y)')).toEqual({ x: 'q' });
    });

    it('allows letters, digits and underscores after a leading letter', () => {
      expect(test('/:a_1/:B2', '/x/y')).toEqual({ a_1: 'x', B2: 'y' });
    });

    it('treats a colon without a leading letter as a literal', () => {
      expect(test('/:1a', '/:1a')).toEqual({});
      expect(test('/:1a', '/z')).toBeNull();
    });

    it('can be named `splat` when there is no splat', () => {
      expect(test('/:splat', '/v')).toEqual({ splat: 'v' });
    });

    // The URL parser percent-encodes the path. Captures keep that
    // encoding, so `%2F` doesn't count as a slash.
    it('captures the percent-encoded form', () => {
      expect(test('/:x', '/a%20b')).toEqual({ x: 'a%20b' });
      expect(test('/:x', '/café')).toEqual({ x: 'caf%C3%A9' });
      expect(test('/:x', '/a%2Fb')).toEqual({ x: 'a%2Fb' });
    });
  });

  describe('splats', () => {
    it('captures the rest of the path, slashes included', () => {
      expect(test('/docs/*', '/docs/a/b/c')).toEqual({ splat: 'a/b/c' });
      expect(test('/docs/*', '/docs/a/')).toEqual({ splat: 'a/' });
    });

    it('matches an empty string', () => {
      expect(test('/docs/*', '/docs/')).toEqual({ splat: '' });
    });

    it('does not make the slash before it optional', () => {
      expect(test('/docs/*', '/docs')).toBeNull();
    });

    it('matches mid-segment', () => {
      expect(test('/docs*', '/docs')).toEqual({ splat: '' });
      expect(test('/docs*', '/docsabc/d')).toEqual({ splat: 'abc/d' });
    });

    it('can sit in the middle of a pattern', () => {
      expect(test('/a/*/tail', '/a/b/c/tail')).toEqual({ splat: 'b/c' });
      expect(test('/a/*/tail', '/a//tail')).toEqual({ splat: '' });
      expect(test('/a/*/tail', '/a/tail')).toBeNull();
    });

    it('leaves the rest of the segment to a placeholder before it', () => {
      expect(test('/:a*', '/abc/def')).toEqual({ a: 'abc', splat: '/def' });
      expect(test('/:a*', '/abc')).toEqual({ a: 'abc', splat: '' });
    });
  });

  describe('hosts', () => {
    it('matches the host and path', () => {
      expect(test('https://example.com/*', 'https://example.com/a')).toEqual({
        splat: 'a',
      });
      expect(test('https://example.com/*', 'https://other.com/a')).toBeNull();
    });

    it('ignores the scheme and port of the URL', () => {
      expect(
        test('https://example.com/*', 'http://example.com:8080/a'),
      ).toEqual({ splat: 'a' });
    });

    it('matches the host case-insensitively', () => {
      expect(test('https://example.com/*', 'https://EXAMPLE.com/a')).toEqual({
        splat: 'a',
      });
    });

    it('captures one host label in a placeholder', () => {
      expect(
        test('https://:sub.example.com/*', 'https://foo.example.com/'),
      ).toEqual({ sub: 'foo', splat: '' });
      expect(
        test('https://:sub.example.com/*', 'https://foo.bar.example.com/'),
      ).toBeNull();
    });

    it('ignores the host for a path-only pattern', () => {
      expect(test('/a', 'https://other.com/a')).toEqual({});
    });
  });
});
