/**
 * Dispatch for the worker's `fetch` event. Same-origin requests go through
 * the router; anything cross-origin goes to the network untouched.
 */

import { serveAssetManifest, serveLogExport } from '@lib/service-worker/api';
import * as assets from '@lib/service-worker/assets';
import type { IRequest } from 'itty-router';
import { IttyRouter } from 'itty-router/IttyRouter';

declare const self: ServiceWorkerGlobalScope;

const localApi = IttyRouter({ base: '/api/local' });
localApi.get('/manifest', serveAssetManifest());
localApi.get('/logs', serveLogExport());

// Routes must cover everything, since the worker has no fallback of its own.
const router = IttyRouter<IRequest, [], Response>();
router.all('/api/local/*', localApi.fetch);
router.all('*', assets.serve());

export const handleFetch = (event: FetchEvent): void => {
  if (new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(router.fetch(event.request));
};
