// Types for the service worker side. Kept free of Node imports so worker
// code can load them.

/**
 * Every deployed file, keyed by its path from the public dir root, with an
 * SRI token (`sha256-…`) for `new Request(url, { integrity })`. Always
 * includes the 404 page, so the worker can serve it for unknown paths.
 */
export interface AssetManifest {
  assets: Record<string, string> & { '/404.html': string };
}

declare global {
  interface ImportMetaEnv {
    /** The service worker's URL path. Register it with this. */
    readonly SERVICE_WORKER_PATH: string;

    /**
     * The asset manifest, injected into the service worker at build time.
     * `undefined` in dev.
     */
    readonly ASSET_MANIFEST: AssetManifest | undefined;
  }
}
