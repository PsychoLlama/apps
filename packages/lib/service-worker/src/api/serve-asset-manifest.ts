import type { AssetManifest } from '@dev/vite-plugin-service-worker/types';
import { getManifest } from '../assets/manifest';

/**
 * Responds with the asset manifest baked into this worker, for inspecting
 * what it caches. 404 without one (dev).
 */
export const serveAssetManifest = (
  manifest: AssetManifest | undefined = getManifest(),
) => {
  return () => {
    if (manifest === undefined) {
      return Response.json(
        { error: 'No asset manifest in this build.' },
        { status: 404 },
      );
    }

    return Response.json(manifest);
  };
};
