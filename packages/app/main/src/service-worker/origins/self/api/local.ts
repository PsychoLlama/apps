import { serveOfflineManifest, serveLogExport } from '@lib/service-worker/api';
import { IttyRouter } from 'itty-router/IttyRouter';

/** Answers `/api/local/*`, the endpoints only the service worker serves. */
export const serveLocalApi = () => {
  const router = IttyRouter({ base: '/api/local' });

  router.get('/manifest', serveOfflineManifest());
  router.get('/logs', serveLogExport());

  return router.fetch;
};
