import { onMount } from 'solid-js';
import { createLogger, toError } from '@lib/observability';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Registers the app's service worker once the calling component mounts.
 * Call it from the app root.
 *
 * Registers in every mode. The worker decides for itself whether to serve
 * from cache.
 */
export const installServiceWorker = () => {
  onMount(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      // Served at a stable URL by `@dev/vite-plugin-service-worker`.
      .register('/service-worker.js', { type: 'module', scope: '/' })
      .catch((error: unknown) => {
        logger.error('Registration failed.', { error: toError(error) });
      });
  });
};
