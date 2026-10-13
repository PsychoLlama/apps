import type { AssetManifest } from '@dev/nitro-module-asset-manifest/types';

/**
 * The asset manifest for this build, or `undefined` when there isn't
 * one (dev). Without it, the worker should stay on the network.
 */
export const getManifest = (): AssetManifest | undefined =>
  // The build replaces this exact text with the manifest, so it must appear
  // verbatim, and only here.
  globalThis.__ASSET_MANIFEST__;
