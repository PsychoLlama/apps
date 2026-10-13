import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { nitro } from 'nitro/vite';
import { substrate } from '@dev/vite-plugin-substrate';
import { substrate as nitroSubstrate } from '@dev/nitro-module-substrate';
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
  // racing the version bump — including the service worker fetch,
  // whose registration silently dies until the page reloads.
  optimizeDeps: {
    include: ['@vanilla-extract/dynamic'],
  },
  server: {
    headers: {
      // The bundled service worker lives under `/_build/`, so its default
      // scope would be limited to that prefix. The dev server needs this
      // header to honor the `scope: '/'` registration; production (and the
      // wrangler-based `preview` script) set the same header via
      // `public/_headers`.
      'Service-Worker-Allowed': '/',
    },
  },
  plugins: [
    substrate({
      solidStart: true,
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
    }),
    nitro({
      preset: 'static',
      modules: [nitroSubstrate()],
    }),
  ],
});
