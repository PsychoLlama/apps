import { resolveAsset } from '../resolve-asset';

const manifest = {
  assets: {
    '/index.html': 'sha256-index',
    '/404.html': 'sha256-404',
    '/about.html': 'sha256-about',
    '/docs/index.html': 'sha256-docs',
    '/assets/app.js': 'sha256-app',
    '/fonts/two words.woff2': 'sha256-font',
  },
  redirects: [],
};

describe('resolveAsset', () => {
  it('matches exact paths', () => {
    expect(resolveAsset(manifest, '/assets/app.js')).toBe('/assets/app.js');
    expect(resolveAsset(manifest, '/about.html')).toBe('/about.html');
  });

  it('serves the root index', () => {
    expect(resolveAsset(manifest, '/')).toBe('/index.html');
    expect(resolveAsset(manifest, '/index')).toBe('/index.html');
    expect(resolveAsset(manifest, '/index.html')).toBe('/index.html');
  });

  it('serves pages without the extension', () => {
    expect(resolveAsset(manifest, '/about')).toBe('/about.html');
    expect(resolveAsset(manifest, '/about/')).toBe('/about.html');
  });

  it('serves directory indexes', () => {
    expect(resolveAsset(manifest, '/docs')).toBe('/docs/index.html');
    expect(resolveAsset(manifest, '/docs/')).toBe('/docs/index.html');
    expect(resolveAsset(manifest, '/docs/index')).toBe('/docs/index.html');
    expect(resolveAsset(manifest, '/docs/index.html')).toBe('/docs/index.html');
  });

  it('decodes the path', () => {
    expect(resolveAsset(manifest, '/fonts/two%20words.woff2')).toBe(
      '/fonts/two words.woff2',
    );
  });

  it('returns nothing for unknown paths', () => {
    expect(resolveAsset(manifest, '/missing')).toBeUndefined();
    expect(resolveAsset(manifest, '/assets/')).toBeUndefined();
  });

  it('returns nothing for malformed paths', () => {
    expect(resolveAsset(manifest, '/%E0%A4%A')).toBeUndefined();
  });
});
