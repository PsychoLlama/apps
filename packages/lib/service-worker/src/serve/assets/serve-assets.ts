import type { OfflineManifest } from '@dev/vite-plugin-service-worker/types';
import { createLogger } from '@lib/observability';
import { IttyRouter } from 'itty-router/IttyRouter';
import { CACHE_NAME, cacheKey } from '../../assets/cache';
import { getManifest } from '../../assets/manifest';
import { resolveAsset } from './resolve-asset';
import { withRedirects, type AssetRequest } from './with-redirects';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * The page Cloudflare serves for unknown paths (`404-page`). The build
 * fails without it, so the manifest always lists it.
 */
const NOT_FOUND_PAGE = '/404.html';

/**
 * A request handler that serves the build's assets from the cache. Mount it
 * as the catch-all route for the app's own origin.
 *
 * Without a manifest (dev), there's nothing cached, so every request goes to
 * the network.
 */
export const serveAssets = (
  manifest: OfflineManifest | undefined = getManifest(),
) => {
  if (manifest === undefined) return serveFromNetwork;

  const router = IttyRouter<AssetRequest, [], Response>();
  router.all('*', withRedirects(manifest), serveFromCache(manifest));

  return router.fetch;
};

const serveFromNetwork = (request: Request) => fetch(request);

/**
 * Answers from the cache alone. The install downloaded every asset, so
 * anything the manifest doesn't list is a real 404, offline or not.
 */
const serveFromCache = (manifest: OfflineManifest) => {
  return async (request: AssetRequest) => {
    const path = resolveAsset(manifest, request.asset.path);

    if (path === undefined) {
      const page = await readAsset(
        NOT_FOUND_PAGE,
        manifest.assets[NOT_FOUND_PAGE],
      );

      if (page.type === 'error') return page;

      return new Response(page.body, { status: 404, headers: page.headers });
    }

    return readAsset(path, manifest.assets[path]);
  };
};

/**
 * Reads an asset by its integrity hash. A miss means the cache was evicted
 * or the install is broken, so fail the request rather than paper over it
 * with the network.
 */
const readAsset = async (path: string, integrityHash: string) => {
  const response = await caches.match(cacheKey(integrityHash), {
    cacheName: CACHE_NAME,
  });

  if (response === undefined) {
    logger.error('Asset missing from the cache.', { path, integrityHash });
    return Response.error();
  }

  return response;
};
