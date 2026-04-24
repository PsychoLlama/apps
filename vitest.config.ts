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
    // Solid ecosystem packages ship raw .jsx in their "solid" export
    // condition, which Node can't load. Inline them so Vite transforms
    // them first.
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
