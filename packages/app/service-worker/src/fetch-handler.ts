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
 * Ceiling on how long we'll wait for the network before serving from
 * cache. Late-arriving responses still refresh the cache in the
 * background, so a slow fetch never gets wasted.
 */
const NAVIGATION_TIMEOUT_MS = 1_500;

/**
 * The slice of `FetchEvent` the navigation handler needs. `Pick`ing
 * from the real event keeps the shape honest and lets tests pass a
 * plain object instead of forging a `FetchEvent`.
 */
export type NavigationContext = Pick<FetchEvent, 'request' | 'waitUntil'> & {
  /**
   * Response the browser started fetching via navigation preload, in
   * parallel with SW startup, before this handler ran. Resolves to
   * `undefined` when no preload ran for this navigation (e.g. the
   * first load that installs the worker), in which case the handler
   * issues its own `fetch`.
   */
  readonly preloadResponse: Promise<Response | undefined>;
};

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
  //
  // `respondWith` must be called synchronously during dispatch, so we
  // hand it the pending promise rather than awaiting the handler first.
  if (event.request.mode === 'navigate' && event.request.method === 'GET') {
    event.respondWith(handleNavigation(event));
  }
};

/**
 * Network-first with a lazy cache fallback, bounded by a tight
 * timeout.
 *
 * - Offline (`navigator.onLine === false`): skip the doomed fetch and
 *   serve cache, or reject so the browser shows its offline page. Only
 *   the negative is trustworthy — `true` is unreliable (a dead subway
 *   connection still reports online).
 * - Online: race the network against the timeout. The network leg
 *   prefers the browser's navigation-preload response (started in
 *   parallel with SW startup) and falls back to its own `fetch`. A
 *   network win returns fresh and refreshes the cache. A timeout serves
 *   the cached entry while the request keeps running in the background,
 *   so a slow response still warms the cache for next time — that's why
 *   there's no `AbortController`.
 *
 * The fetch's rejection handler collapses a network error into
 * `undefined` instead of throwing. A failed fetch then flows through
 * the same cache-fallback path as a timeout, and `waitUntil` never
 * receives a rejection (which it would count against the SW).
 */
export const handleNavigation = async (
  ctx: NavigationContext,
): Promise<Response> => {
  // Swallow a rejected preload (offline, network error) up front so it
  // never surfaces as an unhandled rejection, including on the offline
  // branch below that ignores it.
  void ctx.preloadResponse.catch(() => {});

  const cache = await openCache(CACHE_NAMES.html);

  if (self.navigator.onLine === false) {
    const cached = await readCachedNavigation(cache, ctx.request);
    if (cached) return cached;
    throw new TypeError('Offline with no cached navigation.');
  }

  const fetchPromise = networkResponse(ctx).then(
    (response) => {
      if (response.ok) ctx.waitUntil(cache.put(ctx.request, response.clone()));
      return response;
    },
    () => undefined,
  );

  // Keep the SW alive for a late cache refresh even when we serve a
  // stale response first.
  ctx.waitUntil(fetchPromise);

  const timeout = new Promise<undefined>((resolve) => {
    setTimeout(resolve, NAVIGATION_TIMEOUT_MS);
  });

  // A network win inside the timeout returns fresh. Otherwise
  // (`undefined` from a timeout or a failed fetch) fall back to cache.
  const winner = await Promise.race([fetchPromise, timeout]);
  if (winner) return winner;

  const cached = await readCachedNavigation(cache, ctx.request);
  if (cached) return cached;

  // No cache, and the network either failed or is still in flight. Give
  // the fetch a last chance to land; if it can't, surface a
  // network-style failure so the browser shows its offline page.
  const response = await fetchPromise;
  if (response) return response;
  throw new TypeError('Offline with no cached navigation.');
};

/**
 * The network leg of the navigation strategy. Prefers the browser's
 * navigation-preload response — started in parallel with SW startup,
 * so it shaves the worker's cold-start latency off the request — and
 * falls back to a normal `fetch` when no preload ran for this
 * navigation.
 */
const networkResponse = async (ctx: NavigationContext): Promise<Response> => {
  const preloaded = await ctx.preloadResponse;
  return preloaded ?? fetch(ctx.request);
};

const readCachedNavigation = async (
  cache: Cache,
  request: Request,
): Promise<Response | undefined> => {
  const cached = await cache.match(request);
  if (cached) {
    logger.info('Serving navigation from cache.', {
      url: new URL(request.url).pathname,
    });
  }
  return cached;
};
