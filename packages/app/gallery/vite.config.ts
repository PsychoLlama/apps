import { defineConfig } from 'vite';
import { nitroV2Plugin as nitro } from '@solidjs/vite-plugin-nitro-2';
import { substrate } from '@dev/vite-plugin-substrate';

export default defineConfig({
  // Pulled in transitively by generated `.css.ts` modules, so Vite's
  // entry scanner misses it. Without this hint, the first cold load
  // re-optimizes deps mid-flight and 504s any in-flight requests
  // racing the version bump.
  optimizeDeps: {
    include: ['@vanilla-extract/dynamic'],
  },
  plugins: [
    substrate({ solidStart: true }),
    nitro({
      preset: 'static',
      prerender: {
        crawlLinks: true,
        // `/404` is rendered via Cloudflare's `not_found_handling`, not
        // linked from any page, so the crawler can't reach it.
        routes: ['/404'],
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
  ],
});
