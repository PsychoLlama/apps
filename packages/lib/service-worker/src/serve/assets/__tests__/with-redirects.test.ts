import type { OfflineManifest } from '@dev/vite-plugin-service-worker/types';
import { compileMatcher, compileTemplate } from '@lib/url-pattern/cloudflare';
import { withRedirects, type AssetRequest } from '../with-redirects';

const manifest = (
  ...rules: Array<[source: string, destination: string, status: number]>
): OfflineManifest => ({
  assets: { '/404.html': 'sha256-404' },
  redirects: rules.map(([source, destination, status]) => [
    compileMatcher({ pathname: source })[0].pathname,
    compileTemplate(destination)[0],
    status,
  ]),
});

const request = (path: string) =>
  new Request(new URL(path, 'https://example.com')) as AssetRequest;

describe('withRedirects', () => {
  it('answers a redirect', () => {
    const response = withRedirects(manifest(['/old', '/new', 301]))(
      request('/old'),
    );

    expect(response?.status).toBe(301);
    expect(response?.headers.get('location')).toBe('https://example.com/new');
  });

  it('points the asset at a rewrite', () => {
    const req = request('/share/x');
    const response = withRedirects(manifest(['/share/:id', '/__share', 200]))(
      req,
    );

    expect(response).toBeUndefined();
    expect(req.asset).toEqual({ path: '/__share' });
  });

  it("defaults the asset to the request's path", () => {
    const req = request('/other?q=1');
    withRedirects(manifest(['/old', '/new', 301]))(req);

    expect(req.asset).toEqual({ path: '/other' });
  });
});
