import { defineConfig } from 'vitest/config';
import solid from 'vite-plugin-solid';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { watchIgnore } from './vite-ignored';

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
    include: ['src/**/*.test.{ts,tsx}'],
    typecheck: {
      enabled: true,
    },
  },
});
