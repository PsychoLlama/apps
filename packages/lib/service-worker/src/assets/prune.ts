import type { AssetManifest } from '@dev/nitro-module-asset-manifest/types';
import { createLogger } from '@lib/observability';
import { CACHE_NAME, cacheKey } from './cache';
import { getManifest } from './manifest';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Deletes cached assets the manifest no longer lists, left over from
 * earlier builds. Call it from the `activate` event through `waitUntil`,
 * once no page runs the old build.
 *
 * Without a manifest (dev), nothing was cached, so there's nothing to do.
 */
export const prune = async (
  manifest: AssetManifest | undefined = getManifest(),
) => {
  if (manifest === undefined) return;

  const cache = await caches.open(CACHE_NAME);
  const current = new Set(Object.values(manifest.assets).map(cacheKey));
  const stale = (await cache.keys()).filter(
    (request) => !current.has(request.url),
  );

  if (!stale.length) return;

  await Promise.all(stale.map((request) => cache.delete(request)));
  logger.info('Stale assets deleted.', { count: stale.length });
};
