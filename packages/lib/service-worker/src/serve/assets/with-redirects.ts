import { format, match } from '@lib/url-pattern/cloudflare';
import type { ServerContext } from './context';

/**
 * Middleware that applies the first matching `_redirects` rule, the way
 * Cloudflare does before it looks for an asset.
 *
 * - A redirect answers the request. It keeps the request's query string
 *   unless the destination has its own.
 * - A `200` is a rewrite: it points `context.asset.path` at the
 *   destination's path, served at the original URL.
 */
export const withRedirects = (request: Request, context: ServerContext) => {
  const url = new URL(request.url);

  for (const [pathname, template, status] of context.manifest.redirects) {
    const params = match({ pathname }, url);
    if (params === null) continue;

    const destination = new URL(normalizeTarget(format(template, params)), url);

    if (status === 200) {
      context.asset.path = destination.pathname;
      return undefined;
    }

    destination.search ||= url.search;

    return Response.redirect(destination.href, status);
  }

  return undefined;
};

// Cloudflare trims the filled destination and, unless it's a full URL,
// collapses repeated slashes, like the `//` from `/new/:splat` when the
// splat starts with `/`.
const normalizeTarget = (target: string) => {
  const trimmed = target.trim();

  return /^\w+:\/\//.test(trimmed) ? trimmed : trimmed.replace(/\/+/g, '/');
};
