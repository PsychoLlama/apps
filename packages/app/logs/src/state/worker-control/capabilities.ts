/**
 * Report whether a service worker currently controls this page — the signal
 * that same-origin navigations (like the log export route) will be answered by
 * the worker rather than escaping to the network. `false` wherever the Service
 * Worker API is unavailable (SSG, unsupported browsers, private windows that
 * disable it).
 */
export const isWorkerControlling = (): boolean =>
  Boolean(globalThis.navigator?.serviceWorker?.controller);

/**
 * Watch for service-worker control handoffs, reporting whether the page is
 * controlled after each change. Returns an unsubscribe; a no-op where the
 * Service Worker API is unavailable.
 *
 * `controllerchange` fires when a newly activated worker claims the page (our
 * worker calls `clients.claim()` on activate), so a first visit flips to
 * controlled without a reload.
 */
export const watchWorkerControl = (
  onChange: (controlled: boolean) => void,
): (() => void) => {
  const container = globalThis.navigator?.serviceWorker;
  if (!container) return () => {};

  const listener = () => onChange(Boolean(container.controller));
  container.addEventListener('controllerchange', listener);
  return () => container.removeEventListener('controllerchange', listener);
};
