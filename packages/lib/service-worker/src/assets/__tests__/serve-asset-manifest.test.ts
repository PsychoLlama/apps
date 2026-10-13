import { serveAssetManifest } from '../serve-asset-manifest';

const manifest = {
  assets: {
    '/index.html': 'sha256-index',
    '/404.html': 'sha256-404',
  },
};

describe('serveAssetManifest', () => {
  it('responds with the manifest', async () => {
    const response = serveAssetManifest(manifest)();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    await expect(response.json()).resolves.toEqual(manifest);
  });

  it('responds 404 without a manifest', async () => {
    const response = serveAssetManifest(undefined)();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toHaveProperty('error');
  });
});
