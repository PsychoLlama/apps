import type { OfflineManifest } from '@dev/vite-plugin-service-worker/types';
import type { IRequestStrict } from 'itty-router';
import { resolveRedirect } from './resolve-redirect';

/** A request after `withRedirects`, annotated with the asset to serve. */
export type AssetRequest = IRequestStrict & {
  asset: {
    /** The pathname to look up, after any `200` rewrite. */
    path: string;
  };
};

/**
 * Middleware that applies the manifest's `_redirects` rules. A redirect
 * answers the request. Otherwise it sets `request.asset.path`: the
 * rewritten path on a `200`, or the request's own path.
 */
export const withRedirects =
  (manifest: OfflineManifest) => (request: AssetRequest) => {
    const url = new URL(request.url);
    const redirect = resolveRedirect(manifest.redirects, url);

    if (redirect?.type === 'redirect') {
      return Response.redirect(redirect.location, redirect.status);
    }

    request.asset = { path: redirect?.pathname ?? url.pathname };

    return undefined;
  };
