/**
 * Shared Vitest building blocks for the workspace's test suites.
 *
 * Both suites are split per package: each package owns a `vitest.unit.config.ts`
 * and/or `vitest.browser.config.ts` re-exporting `@dev/vitest-config/unit` or
 * `@dev/vitest-config/browser` (the latter run under `chromium-lock`), so turbo
 * caches and reruns tests per package instead of the whole monorepo on every
 * change.
 */

import { defineConfig } from 'vitest/config';
import { substrate } from '@dev/vite-plugin-substrate';

/** Defaults every suite layers its own settings onto with `mergeConfig`. */
export const sharedConfig = defineConfig({
  // Transform source exactly the way the apps build it.
  plugins: substrate(),
  test: {
    globals: true,
    // Pin suites to UTC so anything touching `Date`/`Intl` behaves
    // identically across dev machines and CI, independent of the host's
    // local timezone.
    env: { TZ: 'UTC' },
    // Default is 15s. Tighter budget surfaces accidental slowness (e.g.
    // tests waiting on Playwright actionability checks against an
    // unactionable element) before it racks up wall-clock. The slowest
    // legitimate test is well under 1s; 5s leaves an order of magnitude
    // of headroom.
    testTimeout: 5_000,
    server: {
      deps: {
        // Inline `@solidjs/*` so Vite compiles the raw `.jsx` they publish
        // under their `"solid"` export condition. Upstream:
        // https://github.com/solidjs/vite-plugin-solid/issues/157
        inline: [/@solidjs\//],
      },
    },
    typecheck: { enabled: true },
  },
});
