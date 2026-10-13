// Types for the service worker side. Kept free of Node imports so worker
// code can load them.

/**
 * Every deployed file, keyed by its path from the public dir root, with an
 * SRI token (`sha256-…`) for `new Request(url, { integrity })`.
 */
export interface AssetManifest {
  assets: Record<string, string>;
}

declare global {
  /**
   * The precache manifest, injected into the service worker at build time.
   * `undefined` in dev.
   */
  var __ASSET_MANIFEST__: AssetManifest | undefined;
}
