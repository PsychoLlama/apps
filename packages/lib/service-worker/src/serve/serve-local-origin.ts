import type { IRequestStrict, IttyRouterType } from 'itty-router';
import { IttyRouter } from 'itty-router/IttyRouter';
import { serveLogExport, serveOfflineManifest } from './api';
import { serveAssets } from './assets';

type Router = IttyRouterType<IRequestStrict, [], Response>;

/**
 * A request handler for every request to the app's own origin: the
 * worker-only endpoints under `/api/local/*`, then the build's assets.
 * Covers everything, since the worker has no fallback of its own.
 */
export const serveLocalOrigin = (): Router['fetch'] => {
  const router: Router = IttyRouter();

  router.get('/api/local/logs', serveLogExport());
  router.get('/api/local/manifest', serveOfflineManifest());
  router.all('*', serveAssets());

  return router.fetch;
};
