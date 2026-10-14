/**
 * The built service worker's file name, served from the site root.
 *
 * The URL can't be content-hashed. Browsers find updates by refetching
 * the registered URL, and a hashed one would only be learned from new
 * HTML. Once the worker serves HTML from its cache, that HTML keeps
 * registering the old URL and the app never updates.
 */
export const SERVICE_WORKER_FILE_NAME = 'service-worker.js';

/**
 * The service worker's URL path. Pages read it as
 * `import.meta.env.SERVICE_WORKER_PATH`.
 */
export const SERVICE_WORKER_FILE_PATH = `/${SERVICE_WORKER_FILE_NAME}`;
