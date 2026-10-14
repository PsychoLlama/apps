import { relative, resolve } from 'node:path';
import type { NitroModule } from 'nitro/types';
import { normalizePath, type Plugin } from 'vite';
import {
  SERVICE_WORKER_FILE_NAME,
  SERVICE_WORKER_FILE_PATH,
} from './constants.ts';
import { assetManifest } from './nitro-module/asset-manifest.ts';

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
 * Under Nitro, it also injects an asset manifest into the built worker.
 */
export const serviceWorker = (
  config: ServiceWorkerConfig,
): Plugin & { nitro: NitroModule } => {
  let entry: string;
  let devUrl: string;

  return {
    name: '@dev/vite-plugin-service-worker',

    // Nitro installs modules from every Vite plugin that carries one. The
    // manifest needs the final public dir, which only Nitro knows.
    nitro: assetManifest(),

    // The worker ships with the browser bundle. Server environments never
    // see it.
    applyToEnvironment: (environment) =>
      environment.config.consumer === 'client',

    // A build-time constant, so pages can register the worker without a
    // runtime import of this plugin.
    config: () => ({
      define: {
        'import.meta.env.SERVICE_WORKER_PATH': JSON.stringify(
          SERVICE_WORKER_FILE_PATH,
        ),
      },
    }),

    configResolved({ root }) {
      entry = resolve(root, config.path);
      devUrl = `/${normalizePath(relative(root, entry))}`;
    },

    // Dev has no bundle, so point the stable URL at the source module and
    // let Vite transform it like any other.
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === SERVICE_WORKER_FILE_PATH) req.url = devUrl;
        next();
      });
    },

    // Emitted as a chunk of the client build rather than a build of its
    // own. An explicit `fileName` puts it at the root, unhashed, and its
    // imports of shared chunks come out relative to it.
    buildStart() {
      if (this.environment.mode !== 'build') return;

      this.emitFile({
        type: 'chunk',
        id: entry,
        fileName: SERVICE_WORKER_FILE_NAME,
      });
    },
  };
};
