/**
 * Browser service worker. Wires lifecycle events to the cached build and
 * `fetch` through `fetch-handler.ts`.
 */

import { createLogger } from '@lib/observability';
import * as assets from '@lib/service-worker/assets';
import { handleFetch } from './fetch-handler';

declare const self: ServiceWorkerGlobalScope;

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * The legacy worker's network-first HTML cache. Nothing reads it anymore.
 * Safe to drop once most installs have activated this worker.
 */
const LEGACY_HTML_CACHE = 'html:1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const manifest = assets.getManifest();

      // Without a manifest (dev), the worker stays on the network.
      if (manifest !== undefined) await assets.download(manifest);

      logger.info('Service worker installed.', {
        serveFrom: manifest === undefined ? 'network' : 'cache',
      });
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const manifest = assets.getManifest();

      // Nothing cached to clean up.
      if (manifest !== undefined) await assets.prune(manifest);
      await caches.delete(LEGACY_HTML_CACHE);

      logger.info('Service worker activated.');
    })(),
  );
});

self.addEventListener('fetch', handleFetch);
