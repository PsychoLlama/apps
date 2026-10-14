import type { OfflineRedirectRule } from '@dev/vite-plugin-service-worker/types';
import { compileMatcher, compileTemplate } from '@lib/url-pattern/cloudflare';
import type { ServerContext } from '../context';
import { withRedirects } from '../with-redirects';

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

const run = (rules: OfflineRedirectRule[], path: string) => {
  const url = new URL(path, 'https://example.com');
  const context: ServerContext = {
    manifest: { assets: { '/404.html': 'sha256-404' }, redirects: rules },
    asset: { path: url.pathname },
  };

  return { response: withRedirects(new Request(url), context), context };
};

const location = (rules: OfflineRedirectRule[], path: string) =>
  run(rules, path).response?.headers.get('location');

describe('withRedirects', () => {
  it('passes through without a matching rule', () => {
    const { response, context } = run([rule('/old', '/new')], '/other?q=1');

    expect(response).toBeUndefined();
    expect(context.asset).toEqual({ path: '/other' });
    expect(run([], '/old').response).toBeUndefined();
  });

  it('redirects to the filled destination', () => {
    const { response } = run(
      [rule('/blog/:id', '/posts/:id', 301)],
      '/blog/42',
    );

    expect(response?.status).toBe(301);
    expect(response?.headers.get('location')).toBe(
      'https://example.com/posts/42',
    );
  });

  it('defaults to a 302', () => {
    expect(run([rule('/old', '/new')], '/old').response?.status).toBe(302);
  });

  it('applies the first rule that matches', () => {
    const rules = [rule('/a/*', '/first'), rule('/a/b', '/second')];
    expect(location(rules, '/a/b')).toBe('https://example.com/first');
  });

  it('redirects across origins', () => {
    expect(
      location([rule('/x/*', 'https://other.test/:splat', 301)], '/x/a/b'),
    ).toBe('https://other.test/a/b');
  });

  it('keeps the query string', () => {
    expect(location([rule('/old', '/new')], '/old?q=1')).toBe(
      'https://example.com/new?q=1',
    );
    expect(location([rule('/old', 'https://other.test/')], '/old?q=1')).toBe(
      'https://other.test/?q=1',
    );
  });

  it("prefers the destination's own query string", () => {
    expect(location([rule('/old', '/new?r=2')], '/old?q=1')).toBe(
      'https://example.com/new?r=2',
    );
  });

  it("keeps the destination's fragment", () => {
    expect(location([rule('/old', '/new#top')], '/old?q=1')).toBe(
      'https://example.com/new?q=1#top',
    );
  });

  it('collapses repeated slashes in a relative destination', () => {
    expect(location([rule('/a*', '/b/:splat')], '/a/c')).toBe(
      'https://example.com/b/c',
    );
  });

  it('points the asset at a rewrite', () => {
    const { response, context } = run(
      [rule('/share/:id', '/__share', 200)],
      '/share/x',
    );

    expect(response).toBeUndefined();
    expect(context.asset).toEqual({ path: '/__share' });
  });

  it('rewrites to the path alone', () => {
    const { context } = run(
      [rule('/a', 'https://other.test/b?c=1', 200)],
      '/a',
    );

    expect(context.asset).toEqual({ path: '/b' });
  });
});
