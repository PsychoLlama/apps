import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { nitroV2Plugin as nitro } from '@solidjs/vite-plugin-nitro-2';
import { solidStart } from '@solidjs/start/config';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import Icons from 'unplugin-icons/vite';
import { generatedArtifacts, scratchDir } from '@dev/build/ignore';
import { assertHashedAssets } from '@dev/build/vite-plugin/assert-hashed-assets';
import { iconPacks } from '@dev/build/vite-plugin/icon-packs';
import { inlineScript } from '@dev/build/vite-plugin/inline-script';
import { instrumentationScope } from '@dev/build/vite-plugin/instrumentation-scope';
import { svgToPng } from '@dev/build/vite-plugin/svg-to-png';

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
  // Pulled in transitively by generated `.css.ts` modules, so Vite's
  // entry scanner misses it. Without this hint, the first cold load
  // re-optimizes deps mid-flight and 504s any in-flight requests
  // racing the version bump — including the service worker fetch,
  // whose registration silently dies until the page reloads.
  optimizeDeps: {
    include: ['@vanilla-extract/dynamic'],
  },
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
  worker: {
    // Vite runs `?worker` bundles through a separate plugin pipeline
    // that does NOT inherit the top-level `plugins` array. The SW
    // uses `import.meta.INSTRUMENTATION_SCOPE`, so the substitution
    // plugin has to be registered here too — otherwise the marker
    // collapses to `undefined` and `createLogger` throws at module
    // load time, killing the worker before any listener attaches.
    plugins: () => [instrumentationScope()],
  },
  plugins: [
    instrumentationScope(),
    inlineScript({
      id: 'virtual:theme-prelude',
      // `import.meta.resolve` walks pnpm's symlinks the same way as a
      // normal import would, returning a `file://` URL string that
      // esbuild gets as an absolute path.
      entry: fileURLToPath(import.meta.resolve('@lib/theme/prelude')),
    }),
    solidStart(),
    nitro({
      preset: 'static',
      prerender: {
        crawlLinks: true,
        // Manual entries for routes the crawler can't reach from `/`:
        //   - `/404`: rendered via Cloudflare's `not_found_handling`,
        //     not linked from any page.
        //   - `/studio/__landing`: sentinel id used by `_redirects` to
        //     send every direct hit on `/studio/:id` to a Playback-shaped
        //     shell. Without it those hits land on the prerendered Studio
        //     index, and the client tries to hydrate Playback's tree onto
        //     Studio's DOM — which crashes. Double underscore signals
        //     "synthetic, not a real id."
        //   - `/experimental`: scratchpad route, intentionally unlisted
        //     from the launcher. Only shipped to preview deploys + local
        //     builds — gating on `GITHUB_REF` matches the workflow's own
        //     production-deploy condition (`github.ref == 'refs/heads/main'`),
        //     so the build going to production omits the prerendered
        //     shell while PR-preview and local builds keep it reachable.
        routes: [
          '/404',
          '/studio/__landing',
          ...(process.env.GITHUB_REF === 'refs/heads/main'
            ? []
            : ['/experimental']),
        ],
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
    iconPacks(),
    svgToPng(),
    vanillaExtractPlugin(),
    Icons({
      compiler: 'solid',
    }),
    assertHashedAssets(),
  ],
});
