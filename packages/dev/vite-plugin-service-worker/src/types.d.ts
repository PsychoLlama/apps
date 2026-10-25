// Types for the service worker side. Kept free of Node imports so worker
// code can load them.

import type { Template } from '@lib/url-pattern/cloudflare';

/**
 * Every deployed file, keyed by its path from the public dir root, with an
 * SRI token (`sha256-…`) for `new Request(url, { integrity })`. Always
 * includes the 404 page, so the worker can serve it for unknown paths.
 */
export interface OfflineManifest {
  assets: Record<string, string> & { '/404.html': string };

  /** The app's Cloudflare `_redirects` rules, compiled, in match order. */
  redirects: OfflineRedirectRule[];
}

/**
 * A compiled `_redirects` rule. Redirects only match the pathname, so the
 * regex ships bare: match with `match({ pathname }, url)`, fill with
 * `format(template, context)`.
 */
export type OfflineRedirectRule = [
  pathname: string,
  template: Template,
  statusCode: number,
];

declare global {
  interface ImportMetaEnv {
    /** The service worker's URL path. Register it with this. */
    readonly SERVICE_WORKER_PATH: string;

    /**
     * The offline manifest, injected into the service worker at build time.
     * `undefined` in dev, or with `offline` turned off.
     */
    readonly OFFLINE_MANIFEST: OfflineManifest | undefined;
  }
}
