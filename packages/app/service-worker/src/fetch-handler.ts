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
export const NAVIGATION_TIMEOUT_MS = 1_500;

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
    // Vite's dev server can take long enough to serve the first
    // navigation that it blows our timeout, at which point we'd hand
    // back a stale cached shell — which then mismatches the live HMR
    // client and trips a SolidJS hydration error. So in dev we never
    // intercept: navigations fall through to the dev server directly,
    // and the cache can't shadow it. `import.meta.env.DEV` is replaced
    // at build time, so this branch is dead-code-eliminated in prod.
    if (import.meta.env.DEV) return;

    event.respondWith(handleNavigation(event));
  }
};

/**
 * Network-first navigation handler. Dispatches on reachability, then
 * resolves to a `Response` — or throws a network-style error so the
 * browser shows its own offline page.
 *
 * Reachability gates the strategy: `onLine === false` is the only
 * trustworthy signal (definitely offline), so we skip the doomed fetch
 * and serve cache. `true` is unreliable — a dead subway connection still
 * reports online — so the ambiguous case is treated as online and left
 * to `networkFirst`'s timeout to sort out.
 */
export const handleNavigation = async (
  ctx: NavigationContext,
): Promise<Response> => {
  // Swallow a rejected preload (offline, network error) up front so it
  // never surfaces as an unhandled rejection — including on the offline
  // branch below, which ignores the preload entirely.
  void ctx.preloadResponse.catch(() => {});

  const cache = await openCache(CACHE_NAMES.html);

  const response =
    self.navigator.onLine === false
      ? await readCachedNavigation(cache, ctx.request)
      : await networkFirst(ctx, cache);

  if (response) return response;

  // Nothing to serve — an offline cache miss, or the network was
  // exhausted while online. Surface a network-style failure so the
  // browser shows its offline page.
  throw new TypeError('Offline with no cached navigation.');
};

/**
 * The online leg: race the network against a tight timeout, falling back
 * to cache when the network is slow or fails. Resolves `undefined` when
 * neither the network nor the cache can satisfy the request.
 *
 * The fetch is never aborted — it keeps running past the timeout (kept
 * alive by `waitUntil`) so a slow response still refreshes the cache for
 * next time, which is why there's no `AbortController`. A network error
 * collapses to `undefined` so it flows through the same cache-fallback
 * path as a timeout, and `waitUntil` never receives a rejection (which it
 * would count against the SW).
 */
const networkFirst = async (
  ctx: NavigationContext,
  cache: Cache,
): Promise<Response | undefined> => {
  const network = fetchWithPreload(ctx).then(
    (response) => {
      if (response.ok) ctx.waitUntil(cache.put(ctx.request, response.clone()));
      return response;
    },
    () => undefined,
  );

  // Keep the SW alive for a late cache refresh even when we serve stale.
  ctx.waitUntil(network);

  // A fresh response inside the budget wins outright. Otherwise serve
  // cache, then give a still-in-flight fetch a last chance to land.
  const fresh = await Promise.race([network, timeout(NAVIGATION_TIMEOUT_MS)]);
  return (
    fresh ?? (await readCachedNavigation(cache, ctx.request)) ?? (await network)
  );
};

/** Resolves to `undefined` after `ms` — the cache-fallback trigger. */
const timeout = (ms: number): Promise<undefined> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * The network leg of the navigation strategy. Prefers the browser's
 * navigation-preload response — started in parallel with SW startup,
 * so it shaves the worker's cold-start latency off the request — and
 * falls back to a normal `fetch` when no preload ran for this
 * navigation.
 */
const fetchWithPreload = async (ctx: NavigationContext): Promise<Response> => {
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
