/// <reference types="@dev/vite-plugin-service-worker/types" />

import { createLogger, toError } from '@lib/observability';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Registers the app's service worker. Call it once the app root mounts:
 * `onMount(installServiceWorker)`.
 *
 * Registers in every mode. The worker decides for itself whether to serve
 * from cache.
 */
export const installServiceWorker = () => {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker
    .register(import.meta.env.SERVICE_WORKER_PATH, {
      type: 'module',
      scope: '/',
    })
    .catch((error: unknown) => {
      logger.error('Registration failed.', { error: toError(error) });
    });
};
