import { createLogger } from '@lib/observability';
import { getAssetManifest, downloadAssets } from '@lib/service-worker';

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
