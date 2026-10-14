import type { OfflineManifest } from '@dev/vite-plugin-service-worker/types';

/**
 * State shared by the asset server's handlers, passed to each one after
 * the request. Handlers may update it for the ones that follow.
 */
export interface ServerContext {
  /** The build's offline manifest. */
  manifest: OfflineManifest;

  asset: {
    /**
     * The pathname to look up. Starts as the request's own, and a `200`
     * rewrite replaces it.
     */
    path: string;
  };
}
