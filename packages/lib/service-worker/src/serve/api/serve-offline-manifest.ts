import type { OfflineManifest } from '@dev/vite-plugin-service-worker/types';
import { getManifest } from '../../assets/manifest';

/**
 * Responds with the offline manifest baked into this worker, for inspecting
 * what it caches. 404 without one (dev).
 */
export const serveOfflineManifest = (
  manifest: OfflineManifest | undefined = getManifest(),
) => {
  return () => {
    if (manifest === undefined) {
      return Response.json(
        { error: 'No offline manifest in this build.' },
        { status: 404 },
      );
    }

    return Response.json(manifest);
  };
};
