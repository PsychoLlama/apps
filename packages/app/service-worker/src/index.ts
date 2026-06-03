/**
 * Browser service worker shipped by @app/main. Activates immediately
 * on install/upgrade and wires the `fetch` listener through
 * `fetch-handler.ts`. Everything beyond lifecycle lives there.
 *
 * Consumed by `@app/main` via Vite's `?worker&url` import — the host
 * bundles this module and registers the resulting URL.
 */

import { purgeStaleCaches } from './caches';
import { handleFetch } from './fetch-handler';

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('install', () => {
  // The app holds no SW-version-coupled state (no precaches keyed to
  // a build, no in-flight IndexedDB migrations), so a new SW can
  // displace its predecessor without waiting for old tabs to close.
  // Revisit this once we cache anything stateful.
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.registration.navigationPreload.enable();
      await self.clients.claim();
      await purgeStaleCaches();
    })(),
  );
});

self.addEventListener('fetch', handleFetch);
