import { IttyRouter } from 'itty-router/IttyRouter';

/** Answers `/api/local/*`, the endpoints only the service worker serves. */
export const serveLocalApi = () => {
  const router = IttyRouter({ base: '/api/local' });

  router.get('/health', () => Response.json({ status: 'online' }));

  return router.fetch;
};
