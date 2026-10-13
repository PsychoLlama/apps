import { relative, resolve } from 'node:path';
import { normalizePath, type Plugin } from 'vite';

/** Options for {@link serviceWorker}. */
export interface ServiceWorkerConfig {
  /** The service worker's entry module, relative to the Vite root. */
  path: string;
}

/**
 * Vite plugin that serves and builds a service worker at a stable
 * `/service-worker.js`. Register it as a module worker
 * (`type: 'module'`).
 *
 * The URL can't be content-hashed. Browsers find updates by refetching
 * the registered URL, and a hashed one would only be learned from new
 * HTML. Once the worker serves HTML from its cache, that HTML keeps
 * registering the old URL and the app never updates.
 */
export const serviceWorker = (config: ServiceWorkerConfig): Plugin => {
  let entry: string;
  let devUrl: string;

  return {
    name: '@dev/vite-plugin-service-worker',

    // The worker ships with the browser bundle. Server environments never
    // see it.
    applyToEnvironment: (environment) =>
      environment.config.consumer === 'client',

    configResolved({ root }) {
      entry = resolve(root, config.path);
      devUrl = `/${normalizePath(relative(root, entry))}`;
    },

    // Dev has no bundle, so point the stable URL at the source module and
    // let Vite transform it like any other.
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === `/${FILE_NAME}`) req.url = devUrl;
        next();
      });
    },

    // Emitted as a chunk of the client build rather than a build of its
    // own. An explicit `fileName` puts it at the root, unhashed, and its
    // imports of shared chunks come out relative to it.
    buildStart() {
      if (this.environment.mode !== 'build') return;

      this.emitFile({ type: 'chunk', id: entry, fileName: FILE_NAME });
    },
  };
};

const FILE_NAME = 'service-worker.js';
