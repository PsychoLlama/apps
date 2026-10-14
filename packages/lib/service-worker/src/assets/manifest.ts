import type { AssetManifest } from '@dev/vite-plugin-service-worker/types';

/**
 * The asset manifest for this build, or `undefined` when there isn't
 * one (dev). Without it, the worker should stay on the network.
 */
export const getManifest = (): AssetManifest | undefined =>
  // The build expands this to an object every time it's referenced.
  // Only reference it once, only here.
  import.meta.env.ASSET_MANIFEST;
