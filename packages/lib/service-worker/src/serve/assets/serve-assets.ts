import type { OfflineManifest } from '@dev/vite-plugin-service-worker/types';
import { assert } from '@lib/assert';
import { createLogger } from '@lib/observability';
import type { IRequestStrict } from 'itty-router';
import { IttyRouter } from 'itty-router/IttyRouter';
import { CACHE_NAME, cacheKey } from '../../assets/cache';
import { getManifest } from '../../assets/manifest';
import type { ServerContext } from './context';
import { resolveAsset } from './resolve-asset';
import { withRedirects } from './with-redirects';

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
 * Only `GET`s are served. Other methods get a `405` rather than the
 * network, so anything offline can't answer breaks loudly instead of
 * working only while online.
 *
 * Without a manifest (dev), there's nothing cached, so every request goes to
 * the network.
 */
export const serveAssets = (
  manifest: OfflineManifest | undefined = getManifest(),
) => {
  if (manifest === undefined) return serveFromNetwork;

  const router = IttyRouter<IRequestStrict, [ServerContext], Response>();
  router.get('*', withRedirects, serveFromCache, serveNotFound);
  router.all('*', rejectMethod);

  return (request: Request) =>
    router.fetch(request, {
      manifest,
      asset: { path: new URL(request.url).pathname },
    });
};

const serveFromNetwork = (request: Request) => fetch(request);

const rejectMethod = () =>
  new Response(null, { status: 405, headers: { Allow: 'GET' } });

/**
 * Answers from the cache alone. Passes when the manifest doesn't list the
 * path, and fails a listed asset that's missing from the cache: that means
 * eviction or a broken install, so don't paper over it with the network.
 */
const serveFromCache = async (
  _request: Request,
  { manifest, asset }: ServerContext,
) => {
  const path = resolveAsset(manifest, asset.path);
  if (path === undefined) return undefined;

  const integrityHash = manifest.assets[path];
  const response = await caches.match(cacheKey(integrityHash), {
    cacheName: CACHE_NAME,
  });

  if (response === undefined) {
    logger.error('Asset missing from the cache.', { path, integrityHash });
    return Response.error();
  }

  return response;
};

/**
 * Serves the 404 page. The install downloaded every asset, so anything
 * the manifest doesn't list is a real 404, offline or not.
 */
const serveNotFound = async (request: Request, context: ServerContext) => {
  context.asset.path = NOT_FOUND_PAGE;
  const page = await serveFromCache(request, context);
  assert(page !== undefined, 'The manifest is missing the 404 page.');

  if (page.type === 'error') return page;

  return new Response(page.body, { status: 404, headers: page.headers });
};
