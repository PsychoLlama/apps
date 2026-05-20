/**
 * Browser service worker shipped by @app/main. Activates immediately
 * on install/upgrade and intercepts `/api/local/health` to short-
 * circuit a JSON response; GET navigations get a lazy-populated
 * cache fallback so offline reloads still work. Everything else
 * falls through to the network unchanged.
 *
 * Consumed by `@app/main` via Vite's `?worker&url` import — the host
 * bundles this module and registers the resulting URL.
 */

import { createLogger } from '@lib/observability';

import { CACHE_NAMES, openCache, purgeStaleCaches } from './caches';

declare const self: ServiceWorkerGlobalScope;

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

self.addEventListener('install', () => {
  // The app holds no SW-version-coupled state (no precaches keyed to
  // a build, no in-flight IndexedDB migrations), so a new SW can
  // displace its predecessor without waiting for old tabs to close.
  // Revisit this once we cache anything stateful.
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([purgeStaleCaches(), self.clients.claim()]));
});

self.addEventListener('fetch', (event) => {
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
});

/**
 * Network-first with a lazy-populated cache fallback. On a successful
 * fetch the response refreshes the cache for future offline reloads;
 * on a network error (genuine `TypeError`, not a 4xx/5xx the server
 * actually returned) we try the cache. A miss re-throws so the
 * browser surfaces its native offline error — a dedicated
 * `/offline.html` shell is planned but out of scope here.
 */
const handleNavigation = async (event: FetchEvent): Promise<Response> => {
  try {
    const response = await fetch(event.request);
    if (response.ok) {
      const cacheable = response.clone();
      event.waitUntil(
        openCache(CACHE_NAMES.html).then((cache) =>
          cache.put(event.request, cacheable),
        ),
      );
    }
    return response;
  } catch (error) {
    const cache = await openCache(CACHE_NAMES.html);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    throw error;
  }
};
