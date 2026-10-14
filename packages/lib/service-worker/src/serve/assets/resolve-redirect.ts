import type { OfflineRedirectRule } from '@dev/vite-plugin-service-worker/types';
import { format, match } from '@lib/url-pattern/cloudflare';

/** What a matching `_redirects` rule asks for. */
export type RedirectIntent =
  | { type: 'redirect'; status: number; location: string }
  | { type: 'rewrite'; pathname: string };

/**
 * Applies the first `_redirects` rule that matches, the way Cloudflare
 * does before it looks for an asset. Returns `undefined` when none match.
 *
 * - A redirect keeps the request's query string unless the destination
 *   has its own.
 * - A `200` is a rewrite: serve the destination's path at the original
 *   URL.
 */
export const resolveRedirect = (
  rules: readonly OfflineRedirectRule[],
  url: URL,
): RedirectIntent | undefined => {
  for (const [pathname, template, status] of rules) {
    const context = match({ pathname }, url);
    if (context === null) continue;

    const destination = new URL(
      normalizeTarget(format(template, context)),
      url,
    );

    if (status === 200) {
      return { type: 'rewrite', pathname: destination.pathname };
    }

    destination.search ||= url.search;
    return { type: 'redirect', status, location: destination.href };
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
