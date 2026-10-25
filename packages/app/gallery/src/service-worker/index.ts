import { serveLogExport } from '@lib/service-worker/serve/api';

declare const self: ServiceWorkerGlobalScope;

/**
 * The worker's only endpoint. The gallery doesn't serve offline, so every
 * other request goes to the network without passing through the worker.
 */
const LOG_EXPORT_PATH = '/api/local/logs';

const exportLogs = serveLogExport();

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname !== LOG_EXPORT_PATH) return;

  event.respondWith(exportLogs());
});
