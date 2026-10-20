import { defineConfig, mergeConfig } from 'vitest/config';
import unit from '@dev/vitest-config/unit';

export default mergeConfig(
  unit,
  defineConfig({
    test: {
      coverage: {
        include: ['src/**/*.ts'],
        // Stubs: typed APIs ahead of their runtime.
        exclude: [
          'src/next/{action,cell,change,store,unimplemented}.ts',
          'src/next/index.ts',
          'src/**/*.test-d.ts',
        ],
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
