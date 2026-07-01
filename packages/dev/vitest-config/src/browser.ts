/**
 * The workspace's browser-suite config, re-exported verbatim as each package's
 * `vitest.browser.config.ts` default. Vitest scopes its root to the cwd (the
 * package directory turbo runs `test:browser` in), so the relative `include`
 * below only matches the invoking package's browser tests. The `test:browser`
 * script wraps `vitest` in `chromium-lock` to serialize Chromium across
 * packages and worktrees.
 */

import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
// Self-reference through the package's own export map rather than a relative
// path: this file is loaded by vitest's node-ESM config loader (not the
// bundler), where an extensionless `./index` won't resolve.
import { sharedPlugins, sharedServerDeps } from '@dev/vitest-config';

export default defineConfig({
  plugins: sharedPlugins(),
  test: {
    name: 'browser',
    globals: true,
    // Pin the suite to UTC so anything touching `Date`/`Intl` behaves
    // identically across dev machines and CI, independent of the host's
    // local timezone.
    env: { TZ: 'UTC' },
    // Default is 15s. Tighter budget surfaces accidental slowness (e.g.
    // tests waiting on Playwright actionability checks against an
    // unactionable element) before it racks up wall-clock.
    testTimeout: 5_000,
    include: ['src/**/*.test.browser.{ts,tsx}'],
    server: { deps: sharedServerDeps },
    typecheck: { enabled: true },
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
});
