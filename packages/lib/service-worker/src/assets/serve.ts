import type { AssetManifest } from '@dev/nitro-module-asset-manifest/types';
import { createLogger } from '@lib/observability';
import { CACHE_NAME, cacheKey } from './cache';
import { getManifest } from './manifest';
import { resolveAsset } from './resolve-asset';

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
export const serve = (manifest: AssetManifest | undefined = getManifest()) => {
  if (manifest === undefined) return serveFromNetwork;

  return serveFromCache(manifest);
};

const serveFromNetwork = (request: Request) => fetch(request);

/**
 * Answers from the cache alone. The install downloaded every asset, so
 * anything the manifest doesn't list is a real 404, offline or not.
 */
const serveFromCache = (manifest: AssetManifest) => {
  return async (request: Request) => {
    const path = resolveAsset(manifest, new URL(request.url).pathname);

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
