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
    }),
  ],
});
