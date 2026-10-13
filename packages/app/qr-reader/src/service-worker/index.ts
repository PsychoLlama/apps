import { createLogger } from '@lib/observability';
import { getAssetManifest } from '@lib/service-worker';

declare const self: ServiceWorkerGlobalScope;

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);
const manifest = getAssetManifest();

self.addEventListener('install', () => {
  logger.info('Installing.', {
    serveFrom: manifest === undefined ? 'network' : 'cache',
  });

  // Nothing to install.
  if (manifest === undefined) return;
});
