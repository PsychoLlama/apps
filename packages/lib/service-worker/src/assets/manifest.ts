import type { OfflineManifest } from '@dev/vite-plugin-service-worker/types';

/**
 * The offline manifest for this build, or `undefined` when there isn't
 * one (dev). Without it, the worker should stay on the network.
 */
export const getManifest = (): OfflineManifest | undefined =>
  // The build expands this to an object every time it's referenced.
  // Only reference it once, only here.
  import.meta.env.OFFLINE_MANIFEST;
