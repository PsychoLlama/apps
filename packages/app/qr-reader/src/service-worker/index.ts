import { createLogger } from '@lib/observability';
import * as assets from '@lib/service-worker/assets';

import { routers } from './routers';

declare const self: ServiceWorkerGlobalScope;

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

self.addEventListener('install', (event) => {
  logger.info('Installing.', {
    serveFrom: assets.getManifest() === undefined ? 'network' : 'cache',
  });

  event.waitUntil(assets.download());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(assets.prune());
});

self.addEventListener('fetch', (event) => {
  const { origin } = new URL(event.request.url);
  const router = routers[origin];

  // Not an origin we serve.
  if (router === undefined) return;

  event.respondWith(router.fetch(event.request));
});
