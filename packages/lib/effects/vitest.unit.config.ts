import { defineConfig, mergeConfig } from 'vitest/config';
import unit from '@dev/vitest-config/unit';

export default mergeConfig(
  unit,
  defineConfig({
    test: {
      coverage: {
        include: ['src/**/*.{ts,tsx}'],
        // Shared fixtures live beside the tests they serve.
        exclude: ['src/**/__tests__/**'],
        thresholds: {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  }),
);
