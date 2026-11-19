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
      nitro: (config) => {
        // One shell for every `/group/:id`, which the crawler can't reach
        // from `/`. Groups exist only in the client's database, and the
        // page's first paint is independent of which one it is.
        // See `docs/dynamic-prerendered-shells.md`.
        config.prerender.routes = ['/group/[id]'];
        config.hooks = {
          'prerender:generate'(route) {
            // Move the shell under `/_dynamic/`, so the rewrite target
            // can't match its source and Cloudflare's loop check doesn't
            // reject the rule.
            if (route.route === '/group/[id]') {
              route.fileName = '/_dynamic/group/[id].html';
            }
          },
        };
      },
      redirects: {
        rules: [
          // Serve the group shell for every group id. A 200 rewrite keeps
          // the id in the URL for the client router. The target is
          // extensionless, percent-encoded, and can't match its source.
          ['/group/:id', encodeURI('/_dynamic/group/[id]'), 200],
        ],
      },
    }),
  ],
});
