import type { AssetManifest } from '@dev/nitro-module-asset-manifest/types';
import { getAssetManifest } from './assets/asset-manifest';

/**
 * A request handler that serves the build's assets from the cache. Mount it
 * as the catch-all route for the app's own origin.
 *
 * Without a manifest (dev), there's nothing cached, so every request goes to
 * the network.
 */
export const serveAssets = (
  manifest: AssetManifest | undefined = getAssetManifest(),
) => {
  if (manifest === undefined) return serveFromNetwork;

  // Serving from the cache comes next. Until then, stay on the network.
  return serveFromNetwork;
};

const serveFromNetwork = (request: Request) => fetch(request);
