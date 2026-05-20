/**
 * Dispatch + handlers for the SW's `fetch` event. Lives outside
 * `index.ts` so the entry file stays focused on lifecycle wiring,
 * and so individual handlers can be exercised in isolation by
 * passing a synthetic context — `FetchEvent` itself is awkward to
 * construct outside a real service worker.
 */

import { createLogger } from '@lib/observability';

import { CACHE_NAMES, openCache } from './caches';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Subset of `FetchEvent` the navigation handler relies on. Defined
 * structurally so tests can pass a plain object instead of needing
 * to forge a real `FetchEvent`.
 */
export interface NavigationContext {
  request: Request;
  waitUntil: (promise: Promise<unknown>) => void;
}

/**
 * Top-level dispatch for every `fetch` event. Filters cross-origin
 * requests (browser handles them), short-circuits the local health
 * check, and routes GET navigations through the offline-aware
 * handler. Anything else falls through to the network unchanged.
 */
export const handleFetch = (event: FetchEvent): void => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname === '/api/local/health') {
    logger.info('Responding to health check.', { url: url.pathname });
    event.respondWith(Response.json({ status: 'online' }));
    return;
  }

  // HTML payloads are mutable (Cloudflare revalidates them per
  // request — see `_headers`), so the SW is the only layer that can
  // survive offline reloads. Subresources under `/_build/*` are
  // immutable and stay in the HTTP cache; non-GET navigations like
  // form posts must not be replayed from cache. Everything else
  // falls through to the network unchanged.
  if (event.request.mode === 'navigate' && event.request.method === 'GET') {
    event.respondWith(handleNavigation(event));
  }
};

/**
 * Network-first with a lazy-populated cache fallback. On a
 * successful fetch the response refreshes the cache for future
 * offline reloads; on a network error (genuine `TypeError`, not a
 * 4xx/5xx the server actually returned) we try the cache. A miss
 * re-throws so the browser surfaces its native offline error — a
 * dedicated `/offline.html` shell is planned but out of scope here.
 */
export const handleNavigation = async (
  ctx: NavigationContext,
): Promise<Response> => {
  try {
    const response = await fetch(ctx.request);
    if (response.ok) {
      const cacheable = response.clone();
      ctx.waitUntil(
        openCache(CACHE_NAMES.html).then((cache) =>
          cache.put(ctx.request, cacheable),
        ),
      );
    }
    return response;
  } catch (error) {
    const cache = await openCache(CACHE_NAMES.html);
    const cached = await cache.match(ctx.request);
    if (cached) {
      logger.info('Serving navigation from cache.', {
        url: new URL(ctx.request.url).pathname,
      });
      return cached;
    }
    throw error;
  }
};
