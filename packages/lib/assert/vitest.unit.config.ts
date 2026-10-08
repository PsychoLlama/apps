import { defineConfig } from 'vitest/config';

// Standalone rather than `@dev/vitest-config/unit`: that preset builds on
// `substrate()`, which reaches this package through `@dev/vite-plugin-pwa`,
// so re-exporting it here would cycle. These tests are plain TypeScript and
// need neither the shared plugin pipeline nor a DOM.
export default defineConfig({
  test: {
    name: 'unit',
    environment: 'node',
    globals: true,
    env: { TZ: 'UTC' },
    testTimeout: 5_000,
    include: ['src/**/*.test.{ts,tsx}'],
    typecheck: { enabled: true },
  },
});
