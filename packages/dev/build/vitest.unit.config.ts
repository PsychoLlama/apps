import { defineConfig } from 'vitest/config';

// Standalone rather than `@dev/vitest-config/unit`: that preset depends on
// this package for its Vite plugins, so re-exporting it here would cycle.
// These tests exercise build tooling directly and need neither the shared
// plugin pipeline nor a DOM.
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
