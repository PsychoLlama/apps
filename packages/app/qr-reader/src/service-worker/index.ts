import { createLogger } from '@lib/observability';
import { getAssetManifest, downloadAssets } from '@lib/service-worker';

import { routers } from './routers';

declare const self: ServiceWorkerGlobalScope;

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);
const manifest = getAssetManifest();

self.addEventListener('install', (event) => {
  logger.info('Installing.', {
    serveFrom: manifest === undefined ? 'network' : 'cache',
  });

  // Nothing to install.
  if (manifest === undefined) return;

  event.waitUntil(downloadAssets(manifest));
});

self.addEventListener('fetch', (event) => {
  const { origin } = new URL(event.request.url);
  const router = routers[origin];

  // Not an origin we serve.
  if (router === undefined) return;

  event.respondWith(router.fetch(event.request));
});
