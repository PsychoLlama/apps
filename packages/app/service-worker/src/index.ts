/**
 * POC service worker. Activates immediately on install/upgrade and
 * intercepts `/api/local/health` to short-circuit a JSON response.
 * Everything else falls through to the network.
 *
 * Consumed by `@app/main` via Vite's `?worker&url` import — the host
 * bundles this module and registers the resulting URL.
 */

import { createLogger } from '@lib/observability';

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
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname !== '/api/local/health') return;

  logger.info('Responding to health check.', { url: url.pathname });
  event.respondWith(Response.json({ status: 'online' }));
});
