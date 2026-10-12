import { defineConfig } from 'vite';
import { nitroV2Plugin as nitro } from '@solidjs/vite-plugin-nitro-2';
import { substrate } from '@dev/vite-plugin-substrate';
import { substrate as nitroSubstrate } from '@dev/nitro-module-substrate';

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
      modules: [nitroSubstrate()],
    }),
  ],
});
