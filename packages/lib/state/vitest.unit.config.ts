import { defineConfig, mergeConfig } from 'vitest/config';
import unit from '@dev/vitest-config/unit';

export default mergeConfig(
  unit,
  defineConfig({
    test: {
      coverage: {
        include: ['src/**/*.ts'],
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
