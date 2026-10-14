import type { ServerContext } from './context';
import { resolveRedirect } from './resolve-redirect';

/**
 * Middleware that applies the manifest's `_redirects` rules. A redirect
 * answers the request, and a `200` rewrite points `context.asset.path` at
 * its destination.
 */
export const withRedirects = (request: Request, context: ServerContext) => {
  const redirect = resolveRedirect(
    context.manifest.redirects,
    new URL(request.url),
  );

  if (redirect?.type === 'redirect') {
    return Response.redirect(redirect.location, redirect.status);
  }

  if (redirect?.type === 'rewrite') {
    context.asset.path = redirect.pathname;
  }

  return undefined;
};
