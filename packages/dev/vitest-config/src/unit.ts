/**
 * The workspace's unit-suite config, re-exported verbatim as each package's
 * `vitest.unit.config.ts` default. Vitest scopes its root to the cwd (the
 * package directory turbo runs `test:unit` in), so the relative `include` below
 * only matches the invoking package's unit tests — and turbo caches each
 * package's run against its own inputs instead of rerunning the whole
 * monorepo on every change.
 */

import { defineConfig, mergeConfig } from 'vitest/config';
import { sharedConfig } from './shared.ts';

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      name: 'unit',
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
    },
  }),
);
