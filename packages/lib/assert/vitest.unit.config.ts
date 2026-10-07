import { defineConfig } from 'vitest/config';

// Standalone rather than `@dev/vitest-config/unit`: that preset depends on
// `@dev/build`, which depends on this package, so re-exporting it here
// would cycle. The tests are plain logic and need neither the shared plugin
// pipeline nor a DOM.
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
