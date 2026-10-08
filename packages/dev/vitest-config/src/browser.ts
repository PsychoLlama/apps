/**
 * The workspace's browser-suite config, re-exported verbatim as each package's
 * `vitest.browser.config.ts` default. Vitest scopes its root to the cwd (the
 * package directory turbo runs `test:browser` in), so the relative `include`
 * below only matches the invoking package's browser tests. The `test:browser`
 * script wraps `vitest` in `chromium-lock` to serialize Chromium across
 * packages and worktrees.
 */

import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';
import { sharedConfig } from './shared.ts';

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      name: 'browser',
      include: ['src/**/*.test.browser.{ts,tsx}'],
      browser: {
        enabled: true,
        provider: playwright({
          launchOptions: {
            executablePath: process.env.CHROMIUM_PATH,
          },
          // Cap Playwright's auto-wait loop. Default is 30s, which means an
          // action against an unactionable element (disabled, off-screen,
          // covered) silently retries until it eats the test budget. 2s is a
          // multiple of any legitimate render/animation we trigger, but tight
          // enough that a misuse fails fast with Playwright's own diagnostic
          // ("element is not enabled", etc.) rather than as a generic vitest
          // timeout.
          actionTimeout: 2_000,
        }),
        headless: true,
        instances: [{ browser: 'chromium' }],
      },
    },
  }),
);
