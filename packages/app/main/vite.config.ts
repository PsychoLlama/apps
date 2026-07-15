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
import { pwaManifest } from '@dev/build/vite-plugin/pwa-manifest';
import { svgToPng } from '@dev/build/vite-plugin/svg-to-png';
import { DEFAULT_THEME_ID, THEME_COLORS } from '@lib/theme/constants';

const workspaceRoot = resolve(import.meta.dirname, '../../..');

// Manifest theme bakes in at build time — the spec has no light/dark
// variants, and browsers ignore `<meta name="theme-color">` for the
// install splash. Prefer the dark value: a dark-to-light flash is
// less jarring than the inverse, and the OLED case is the one users
// notice.
const manifestThemeColor = THEME_COLORS[DEFAULT_THEME_ID].dark;

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
    headers: {
      // The bundled service worker lives under `/_build/`, so its default
      // scope would be limited to that prefix. The dev server needs this
      // header to honor the `scope: '/'` registration; production (and the
      // wrangler-based `preview` script) set the same header via
      // `public/_headers`.
      'Service-Worker-Allowed': '/',
    },
    allowedHosts: [
      // Cloudflare Tunnel occasionally used for testing on mobile.
      'apps.jessegibson.dev',
    ],
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
        //   - `/scratchpad` and `/beam`: flag-gated app routes,
        //     unlisted from the launcher whenever their flag is off.
        //     Their shells ship in every build; the service worker gates
        //     access at runtime via the per-app flag (see
        //     `@lib/runtime-config`), so there's nothing to decide at
        //     build time here.
        //   - `/beam/with/__endpoint`: a representative shell for the
        //     dynamic `/beam/with/:endpoint` route. The endpoint id only
        //     exists client-side (it's a live relay handle), so the route
        //     can't be prerendered per-id — but its first paint is a fixed
        //     stub independent of the id, so one shell serves every id. The
        //     `__endpoint` sentinel stands in for the missing id; the hook
        //     below flattens it to `/beam/__endpoint.html`, and
        //     `public/_redirects` rewrites `/beam/with/*` onto it so a cold
        //     load hydrates against a beam-shaped shell instead of the
        //     404 page (which would mismatch and throw).
        routes: ['/404', '/scratchpad', '/beam', '/beam/with/__endpoint'],
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

          // Flatten the `/beam/with/:endpoint` shell up one level, to a
          // sibling of `/beam/with/` rather than a child of it.
          // `public/_redirects` rewrites `/beam/with/*` onto it, and
          // Cloudflare normalizes rewrite targets by stripping `/index` and
          // `.html` before its loop check — so a target left under
          // `/beam/with/` would renormalize into the `/beam/with/*` source
          // and the whole rule gets rejected as an infinite loop. Nesting at
          // `/beam/` (a shallower prefix the source can't match) keeps the
          // shell tucked under the beam app without tripping that check.
          if (route.route === '/beam/with/__endpoint') {
            route.fileName = '/beam/__endpoint.html';
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
