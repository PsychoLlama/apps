import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { nitroV2Plugin as nitro } from '@solidjs/vite-plugin-nitro-2';
import { solidStart } from '@solidjs/start/config';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import Icons from 'unplugin-icons/vite';
import { generatedArtifacts, scratchDir } from '@dev/build/ignore';
import { assertHashedAssetNames } from '@dev/build/vite-plugin';

const workspaceRoot = resolve(import.meta.dirname, '../../..');

// The bundled service worker lives under `/_build/`, so its default
// scope would be limited to that prefix. Both Vite servers (dev and
// preview) need this header to honor the `scope: '/'` registration;
// `vite preview` reads its own `preview.headers`, ignoring `server.*`.
// Production sets the same header via `public/_headers`.
const widenServiceWorkerScope = {
  'Service-Worker-Allowed': '/',
};

export default defineConfig({
  server: {
    watch: {
      // Vite's chokidar watcher doesn't respect .gitignore.
      ignored: [...generatedArtifacts, scratchDir(workspaceRoot)],
    },
    headers: widenServiceWorkerScope,
  },
  preview: {
    headers: widenServiceWorkerScope,
  },
  plugins: [
    solidStart(),
    nitro({
      preset: 'static',
      prerender: {
        crawlLinks: true,
        // `__landing` is a sentinel id used by `_redirects` to send every
        // direct hit on `/studio/:id` to a Playback-shaped shell. Without
        // it those hits land on the prerendered Studio index, and the
        // client tries to hydrate Playback's tree onto Studio's DOM —
        // which crashes. Double underscore signals "synthetic, not a
        // real id."
        routes: ['/404', '/studio/__landing'],
      },
      hooks: {
        // Cloudflare's `not_found_handling = "404-page"` looks for a file
        // literally named `404.html` at the assets root. Nitro's default
        // autoSubfolderIndex would emit `/404/index.html`; rename just
        // this one route so the rest of the site keeps pretty URLs.
        'prerender:generate'(route) {
          if (route.route === '/404') {
            route.fileName = '/404.html';
          }
        },
      },
    }),
    vanillaExtractPlugin(),
    Icons({
      compiler: 'solid',
    }),
    assertHashedAssetNames(),
  ],
});
