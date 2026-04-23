import { defineConfig } from 'vitest/config';
import solid from 'vite-plugin-solid';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig({
  plugins: [solid(), vanillaExtractPlugin()],
  server: {
    watch: {
      // Vite's chokidar watcher does not respect .gitignore. Build
      // artifacts and tool directories must be excluded explicitly.
      ignored: [
        '**/.direnv/**',
        '**/.claude/**',
        '**/.nitro/**',
        '**/.output/**',
        '**/.wrangler/**',
        '**/storybook-static/**',
        '**/result*/**',
      ],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['packages/**/*.test.{ts,tsx}'],
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
