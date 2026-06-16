import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { nitroV2Plugin as nitro } from '@solidjs/vite-plugin-nitro-2';
import { solidStart } from '@solidjs/start/config';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import Icons from 'unplugin-icons/vite';
import { generatedArtifacts, scratchDir } from '@dev/build/ignore';
import { includesExperimentalApp } from '@dev/build/release';
import { assertHashedAssets } from '@dev/build/vite-plugin/assert-hashed-assets';
import { iconPacks } from '@dev/build/vite-plugin/icon-packs';
import { inlineScript } from '@dev/build/vite-plugin/inline-script';
import { instrumentationScope } from '@dev/build/vite-plugin/instrumentation-scope';
import { pwaManifest } from '@dev/build/vite-plugin/pwa-manifest';
import { svgToPng } from '@dev/build/vite-plugin/svg-to-png';
import { DEFAULT_THEME_ID, THEME_COLORS } from '@lib/theme/constants';

const workspaceRoot = resolve(import.meta.dirname, '../../..');

// Single source of truth for the experimental app's release inclusion.
// Drives both the prerendered route list (below) and the launcher link
// — inlined into the bundle via `define` so the launcher and the route
// gate agree without the client ever reading `process.env`. `GITHUB_REF`
// must be declared on turbo's `build` task so it reaches this read (and
// participates in the cache key) under turbo's strict env mode.
const includeExperimental = includesExperimentalApp(process.env.GITHUB_REF);

// Manifest theme bakes in at build time — the spec has no light/dark
// variants, and browsers ignore `<meta name="theme-color">` for the
// install splash. Prefer the dark value: a dark-to-light flash is
// less jarring than the inverse, and the OLED case is the one users
// notice.
const manifestThemeColor = THEME_COLORS[DEFAULT_THEME_ID].dark;

// The bundled service worker lives under `/_build/`, so its default
// scope would be limited to that prefix. The dev server needs this
// header to honor the `scope: '/'` registration; production (and the
// wrangler-based `preview` script) set the same header via
// `public/_headers`.
const widenServiceWorkerScope = {
  'Service-Worker-Allowed': '/',
};

export default defineConfig({
  define: {
    'import.meta.env.INCLUDE_EXPERIMENTAL_APP':
      JSON.stringify(includeExperimental),
  },
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
    // Reached through a Cloudflare Tunnel for testing on mobile devices.
    allowedHosts: ['apps.jessegibson.dev'],
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
      // Render-blocking budget. Today's IIFE sits well under this;
      // the ceiling is a tripwire for accidental bloat — e.g. an
      // import that pulls a `.css.ts` module's runtime registration
      // into the head script.
      maxBytes: 2048,
    }),
    solidStart(),
    nitro({
      preset: 'static',
      prerender: {
        crawlLinks: true,
        // Manual entries for routes the crawler can't reach from `/`:
        //   - `/404`: rendered via Cloudflare's `not_found_handling`,
        //     not linked from any page.
        //   - `/logs/session`: the route-shaped shell for the dynamic
        //     `/logs/:file` viewer. Its file names only exist at runtime,
        //     so the crawler never reaches a concrete instance; this one
        //     shell is prerendered and `public/_redirects` rewrites every
        //     `/logs/*` onto it, so a hard load (or refresh) of a session
        //     URL serves a real HTML shell instead of 404ing. The client
        //     router fills in the actual file on hydration.
        //   - `/experimental`: scratchpad route, intentionally unlisted
        //     from the launcher. Only shipped to preview deploys + local
        //     builds (see `includesExperimentalApp`) — the production
        //     build omits the prerendered shell while PR-preview and
        //     local builds keep it reachable.
        routes: [
          '/404',
          '/logs/session',
          ...(includeExperimental ? ['/experimental'] : []),
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
    pwaManifest({
      icon: {
        src: resolve(import.meta.dirname, 'src/branding/brandmark.svg'),
        maskable: resolve(
          import.meta.dirname,
          'src/branding/brandmark-maskable.svg',
        ),
        sizes: [192, 512],
      },
      manifest: {
        id: '/',
        // `short_name` would only matter if it differed from `name`.
        // Browsers fall back to `name` when it's absent.
        name: 'Apps',
        description: 'A collection of personal apps.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: manifestThemeColor,
        background_color: manifestThemeColor,
      },
    }),
    vanillaExtractPlugin(),
    Icons({
      compiler: 'solid',
    }),
    assertHashedAssets(),
  ],
});
