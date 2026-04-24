import { defineConfig } from 'vitest/config';
import solid from 'vite-plugin-solid';
import Icons from 'unplugin-icons/vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { generatedArtifacts, scratchDir } from '@dev/build/ignore';

export default defineConfig({
  plugins: [solid(), Icons({ compiler: 'solid' }), vanillaExtractPlugin()],
  server: {
    watch: {
      // Vite's chokidar watcher doesn't respect .gitignore.
      ignored: [...generatedArtifacts, scratchDir(import.meta.dirname)],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['packages/**/*.test.{ts,tsx}'],
    // Inline `@solidjs/*` so vite compiles the raw `.jsx` they publish
    // under their `"solid"` export condition. Upstream:
    // https://github.com/solidjs/vite-plugin-solid/issues/157
    server: {
      deps: {
        inline: [/@solidjs\//],
      },
    },
    typecheck: {
      enabled: true,
    },
    coverage: {
      include: ['packages/lib/state/src/**/*.ts'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
