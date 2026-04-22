import { defineConfig } from 'vitest/config';
import solid from 'vite-plugin-solid';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

const watchIgnore = [
  '**/.direnv/**',
  '**/.claude/**',
  '**/.nitro/**',
  '**/.output/**',
  '**/.wrangler/**',
  '**/storybook-static/**',
  '**/result*/**',
];

export default defineConfig({
  plugins: [solid(), vanillaExtractPlugin()],
  server: {
    watch: {
      ignored: watchIgnore,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['packages/**/*.test.{ts,tsx}', 'apps/**/src/**/*.test.{ts,tsx}'],
    typecheck: {
      enabled: true,
    },
    coverage: {
      include: ['packages/state/src/**/*.ts'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
