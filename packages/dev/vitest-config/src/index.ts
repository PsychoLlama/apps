/**
 * Shared Vitest building blocks for the workspace's test suites.
 *
 * The unit suite runs centrally from the root `vitest.config.ts`; the
 * browser suite is split per package (each package owns a
 * `vitest.browser.config.ts` that re-exports {@link browserConfig}) so
 * turbo caches and reruns browser tests per package instead of booting
 * Chromium for the whole monorepo on every change. Both suites must
 * transform source through the *same* Vite plugin pipeline, so it lives
 * here as the single source of truth.
 */

import { playwright } from '@vitest/browser-playwright';
import solid from 'vite-plugin-solid';
import Icons from 'unplugin-icons/vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { instrumentationScope } from '@dev/build/vite-plugin/instrumentation-scope';
import { iconPacks } from '@dev/build/vite-plugin/icon-packs';
import { defineConfig } from 'vitest/config';

/**
 * The Vite plugin pipeline every suite shares — the Solid compiler, icon
 * virtual modules, and vanilla-extract — so a module under test transforms
 * exactly the way it does in the app. A factory (not a shared array) so each
 * config gets its own plugin instances rather than aliasing stateful ones.
 */
export const sharedPlugins = () => [
  instrumentationScope(),
  solid(),
  Icons({ compiler: 'solid' }),
  iconPacks(),
  vanillaExtractPlugin(),
];

/**
 * Inline `@solidjs/*` so Vite compiles the raw `.jsx` they publish under
 * their `"solid"` export condition. Upstream:
 * https://github.com/solidjs/vite-plugin-solid/issues/157
 */
export const sharedServerDeps = { inline: [/@solidjs\//] };

/**
 * A complete browser-suite config, scoped to whichever package re-exports it
 * as its `vitest.browser.config.ts` default: Vitest resolves the config's
 * root to that file's directory, so the relative `include` only matches that
 * package's browser tests.
 */
export const browserConfig = defineConfig({
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
