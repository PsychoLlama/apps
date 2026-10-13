import type { AssetManifest } from '@dev/vite-plugin-service-worker/types';
import { assert } from '@lib/assert';
import { createLogger, toError } from '@lib/observability';
import { CACHE_NAME, cacheKey } from './cache';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Downloads every asset in the manifest that isn't cached yet. Call it from
 * the `install` event through `waitUntil`, so a failed download fails the
 * install and the previous worker keeps serving.
 *
 * Entries are keyed by content hash, not path. Assets that didn't change
 * between builds are already cached and cost nothing.
 */
export const download = async (manifest: AssetManifest) => {
  const cache = await caches.open(CACHE_NAME);
  const assets = byIntegrityHash(manifest);
  const missing = await findMissing(cache, assets);

  if (!missing.length) return;

  try {
    await Promise.all(
      missing.map(async ([integrityHash, path]) => {
        await cache.put(
          cacheKey(integrityHash),
          await downloadAsset(path, integrityHash),
        );
      }),
    );

    logger.info('Assets downloaded and cached.', {
      total: assets.size - missing.length,
      new: missing.length,
    });
  } catch (error) {
    logger.error('Asset download failed.', { error: toError(error) });
    throw error;
  }
};

/**
 * One path per integrity hash. Files with identical content share an entry,
 * so any one of their paths will do.
 */
const byIntegrityHash = (manifest: AssetManifest) =>
  new Map(
    Object.entries(manifest.assets).map(([path, integrityHash]) => [
      integrityHash,
      path,
    ]),
  );

/** The `[integrityHash, path]` pairs not yet in the cache. */
const findMissing = async (cache: Cache, assets: Map<string, string>) => {
  const cached = await Promise.all(
    Array.from(
      assets.keys(),
      async (integrityHash) =>
        (await cache.match(cacheKey(integrityHash))) !== undefined,
    ),
  );

  return Array.from(assets).filter((_entry, index) => !cached[index]);
};

/**
 * Fetches the asset, failing unless its bytes match the manifest.
 * `no-cache` revalidates so a stale HTTP cache copy can't fail the check.
 */
const downloadAsset = async (path: string, integrityHash: string) => {
  const response = await fetch(
    new Request(path, {
      integrity: integrityHash,
      cache: 'no-cache',
    }),
  );

  assert(response.ok, `Asset download got ${response.status} for ${path}.`);

  // Cloudflare redirects HTML files to their pretty URLs (`/index.html` to
  // `/`). Browsers refuse a redirected response for a navigation, so cache
  // a copy without the flag.
  return response.redirected ? new Response(response.body, response) : response;
};
