import { defineConfig } from 'vite';
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
    substrate({
      type: 'app',
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
