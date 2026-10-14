import type { OfflineRedirectRule } from '@dev/vite-plugin-service-worker/types';
import { compileMatcher, compileTemplate } from '@lib/url-pattern/cloudflare';
import { resolveRedirect } from '../resolve-redirect';

// Mirrors what the build ships, so the tests run the real compiled shape.
const rule = (
  source: string,
  destination: string,
  status = 302,
): OfflineRedirectRule => [
  compileMatcher({ pathname: source })[0].pathname,
  compileTemplate(destination)[0],
  status,
];

const resolve = (rules: OfflineRedirectRule[], url: string) =>
  resolveRedirect(rules, new URL(url, 'https://example.com'));

describe('resolveRedirect', () => {
  it('returns nothing without a matching rule', () => {
    expect(resolve([rule('/old', '/new')], '/other')).toBeUndefined();
    expect(resolve([], '/old')).toBeUndefined();
  });

  it('redirects to the filled destination', () => {
    expect(resolve([rule('/blog/:id', '/posts/:id', 301)], '/blog/42')).toEqual(
      {
        type: 'redirect',
        status: 301,
        location: 'https://example.com/posts/42',
      },
    );
  });

  it('applies the first rule that matches', () => {
    const rules = [rule('/a/*', '/first'), rule('/a/b', '/second')];
    expect(resolve(rules, '/a/b')).toMatchObject({
      location: 'https://example.com/first',
    });
  });

  it('redirects across origins', () => {
    expect(
      resolve([rule('/x/*', 'https://other.test/:splat', 301)], '/x/a/b'),
    ).toMatchObject({ location: 'https://other.test/a/b' });
  });

  it('keeps the query string', () => {
    expect(resolve([rule('/old', '/new')], '/old?q=1')).toMatchObject({
      location: 'https://example.com/new?q=1',
    });
    expect(
      resolve([rule('/old', 'https://other.test/')], '/old?q=1'),
    ).toMatchObject({ location: 'https://other.test/?q=1' });
  });

  it("prefers the destination's own query string", () => {
    expect(resolve([rule('/old', '/new?r=2')], '/old?q=1')).toMatchObject({
      location: 'https://example.com/new?r=2',
    });
  });

  it("keeps the destination's fragment", () => {
    expect(resolve([rule('/old', '/new#top')], '/old?q=1')).toMatchObject({
      location: 'https://example.com/new?q=1#top',
    });
  });

  it('collapses repeated slashes in a relative destination', () => {
    expect(resolve([rule('/a*', '/b/:splat')], '/a/c')).toMatchObject({
      location: 'https://example.com/b/c',
    });
  });

  it('rewrites on a 200', () => {
    expect(resolve([rule('/share/:id', '/__share', 200)], '/share/x')).toEqual({
      type: 'rewrite',
      pathname: '/__share',
    });
  });

  it('rewrites to the path alone', () => {
    expect(
      resolve([rule('/a', 'https://other.test/b?c=1', 200)], '/a'),
    ).toEqual({ type: 'rewrite', pathname: '/b' });
  });
});
