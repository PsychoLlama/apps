import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { substrate } from '@dev/vite-plugin-substrate';
import { DEFAULT_THEME_ID, THEME_COLORS } from '@lib/theme/constants';
import * as app from './src/constants';

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
  // racing the version bump.
  optimizeDeps: {
    include: ['@vanilla-extract/dynamic'],
  },
  plugins: [
    substrate({
      type: 'app',
      pwa: {
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
          name: app.name,
          description: app.description,
          start_url: '/',
          scope: '/',
          display: 'standalone',
          theme_color: manifestThemeColor,
          background_color: manifestThemeColor,
        },
      },
      serviceWorker: {
        path: 'src/service-worker/index.ts',
      },
      redirect: {
        rules: [
          // Forward PWAs still re-fetching the old hashed manifest URL (now
          // gone) to the stable path. `_redirects` fire even when no asset
          // matches. Removable in ~a month, once most installs have refreshed.
          //
          // Anchor the match to the `.webmanifest` extension: a bare
          // `manifest-*` splat also swallows hashed route chunks like
          // `manifest-route-<hash>.js` (301'd to JSON, they break the
          // gallery's dynamic import). The `:hash` placeholder matches any
          // non-`/` run — hyphenated hashes included — while the trailing
          // literal keeps it scoped to the old manifest asset.
          '/_build/assets/manifest-:hash.webmanifest  /manifest.webmanifest  301',

          // The icon editor moved to its own worker. Forward old links there;
          // the query string carries the editor state (`?icon=…`) and passes
          // through untouched. Prod-only: `_redirects` can't match or rewrite
          // by host, so previews and staging forward to prod too. The bare
          // path needs its own rule: the splat doesn't match `/icon-editor`
          // without a trailing slash.
          '/icon-editor    https://icon-editor.psychollama.io/        301',
          '/icon-editor/*  https://icon-editor.psychollama.io/:splat  301',

          // The gallery moved to its own worker, with manifest pages at the
          // root (`/gallery/lib-ui` → `/lib-ui`). Prod-only for the same
          // reason as above.
          '/gallery    https://gallery.psychollama.io/        301',
          '/gallery/*  https://gallery.psychollama.io/:splat  301',

          // The QR reader moved to its own worker, served from the root.
          // Prod-only for the same reason as above.
          '/scanner    https://qr.psychollama.io/        301',
          '/scanner/*  https://qr.psychollama.io/:splat  301',

          // Beam moved to its own worker, served from the root. Old invite
          // links (`/beam/share/<id>`) land on `/share/<id>` there. Prod-only
          // for the same reason as above.
          '/beam    https://beam.psychollama.io/        301',
          '/beam/*  https://beam.psychollama.io/:splat  301',
        ],
      },
      headers: {
        rules: [
          // Cache policy: docs/asset-caching.md
          {
            pattern: '/_build/*',
            headers: {
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          },
        ],
      },
    }),
  ],
});
