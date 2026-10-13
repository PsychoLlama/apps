import { serveAssets } from '@lib/service-worker';
import type { IRequest, IttyRouterType } from 'itty-router';
import { IttyRouter } from 'itty-router/IttyRouter';

import { serveLocalApi } from './api/local';

/**
 * Answers every request to the app's own origin. Routes must cover
 * everything, since the worker has no fallback of its own.
 */
export type Router = IttyRouterType<IRequest, [], Response>;

export const createSelfRouter = (): Router =>
  IttyRouter().all('/api/local/*', serveLocalApi()).all('*', serveAssets());
