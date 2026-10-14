import { relative, resolve } from 'node:path';
import type { NitroModule } from 'nitro/types';
import { normalizePath, type Plugin } from 'vite';
import {
  getRedirectsApi,
  type RedirectsApi,
} from '@dev/vite-plugin-redirects/api';
import {
  OFFLINE_MANIFEST_SENTINEL,
  SERVICE_WORKER_FILE_NAME,
  SERVICE_WORKER_FILE_PATH,
} from './constants.ts';
import { offlineManifest } from './nitro-module/offline-manifest.ts';

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
 * Under Nitro, it also injects an offline manifest into the built worker.
 */
export const serviceWorker = (
  config: ServiceWorkerConfig,
): Plugin & { nitro: NitroModule } => {
  let entry: string;
  let devUrl: string;
  let redirects: RedirectsApi | undefined;

  return {
    name: '@dev/vite-plugin-service-worker',

    // Nitro installs modules from every Vite plugin that carries one. The
    // manifest needs the final public dir, which only Nitro knows.
    nitro: offlineManifest(() => redirects?.getRules() ?? []),

    // The worker ships with the browser bundle. Server environments never
    // see it.
    applyToEnvironment: (environment) =>
      environment.config.consumer === 'client',

    // Build-time constants, so code can read them without a runtime import
    // of this plugin.
    config: (_config, { command }) => ({
      define: {
        'import.meta.env.SERVICE_WORKER_PATH': JSON.stringify(
          SERVICE_WORKER_FILE_PATH,
        ),

        // Builds leave a sentinel for the Nitro module to swap the manifest
        // into. Dev has no manifest.
        'import.meta.env.OFFLINE_MANIFEST':
          command === 'build' ? OFFLINE_MANIFEST_SENTINEL : 'undefined',
      },
    }),

    configResolved({ root, plugins }) {
      entry = resolve(root, config.path);
      devUrl = `/${normalizePath(relative(root, entry))}`;
      redirects = getRedirectsApi(plugins);
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
