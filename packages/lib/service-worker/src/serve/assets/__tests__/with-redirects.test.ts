import { compileMatcher, compileTemplate } from '@lib/url-pattern/cloudflare';
import type { ServerContext } from '../context';
import { withRedirects } from '../with-redirects';

const context = (
  path: string,
  ...rules: Array<[source: string, destination: string, status: number]>
): ServerContext => ({
  manifest: {
    assets: { '/404.html': 'sha256-404' },
    redirects: rules.map(([source, destination, status]) => [
      compileMatcher({ pathname: source })[0].pathname,
      compileTemplate(destination)[0],
      status,
    ]),
  },
  asset: { path },
});

const request = (path: string) =>
  new Request(new URL(path, 'https://example.com'));

describe('withRedirects', () => {
  it('answers a redirect', () => {
    const response = withRedirects(
      request('/old'),
      context('/old', ['/old', '/new', 301]),
    );

    expect(response?.status).toBe(301);
    expect(response?.headers.get('location')).toBe('https://example.com/new');
  });

  it('points the asset at a rewrite', () => {
    const ctx = context('/share/x', ['/share/:id', '/__share', 200]);

    expect(withRedirects(request('/share/x'), ctx)).toBeUndefined();
    expect(ctx.asset).toEqual({ path: '/__share' });
  });

  it('leaves the asset alone without a match', () => {
    const ctx = context('/other', ['/old', '/new', 301]);

    expect(withRedirects(request('/other'), ctx)).toBeUndefined();
    expect(ctx.asset).toEqual({ path: '/other' });
  });
});
