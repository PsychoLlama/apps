import { defineConfig } from 'vitest/config';

// Standalone rather than `@dev/vitest-config/unit`: that preset is meant to
// consume this package for its watcher ignores, so re-exporting it here
// would cycle. These tests drive real git repos and need no DOM.
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
