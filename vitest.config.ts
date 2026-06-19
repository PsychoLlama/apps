import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import solid from 'vite-plugin-solid';
import Icons from 'unplugin-icons/vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { generatedArtifacts, scratchDir } from '@dev/build/ignore';
import { iconPacks } from '@dev/build/vite-plugin/icon-packs';
import { instrumentationScope } from '@dev/build/vite-plugin/instrumentation-scope';

const sharedPlugins = [
  instrumentationScope(),
  solid(),
  Icons({ compiler: 'solid' }),
  iconPacks(),
  vanillaExtractPlugin(),
];

const sharedServer = {
  watch: {
    // Vite's chokidar watcher doesn't respect .gitignore.
    ignored: [...generatedArtifacts, scratchDir(import.meta.dirname)],
  },
  // Inline `@solidjs/*` so vite compiles the raw `.jsx` they publish
  // under their `"solid"` export condition. Upstream:
  // https://github.com/solidjs/vite-plugin-solid/issues/157
  deps: {
    inline: [/@solidjs\//],
  },
};

export default defineConfig({
  test: {
    // Pin the suite to UTC so anything touching `Date`/`Intl` behaves
    // identically across dev machines and CI, independent of the host's
    // local timezone.
    env: { TZ: 'UTC' },
    // Default is 15s. Tighter budget surfaces accidental slowness
    // (e.g. tests waiting on Playwright actionability checks against
    // an unactionable element) before it racks up wall-clock and
    // before it starts racing other ~15s clocks. The slowest
    // legitimate test in the suite at the time of writing is well
    // under 1s; 5s leaves an order of magnitude of headroom.
    testTimeout: 5_000,
    coverage: {
      include: ['packages/lib/state/src/**/*.ts'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
    projects: [
      {
        plugins: sharedPlugins,
        server: sharedServer,
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          include: ['packages/**/*.test.{ts,tsx}'],
          server: { deps: sharedServer.deps },
          typecheck: { enabled: true },
        },
      },
      {
        plugins: sharedPlugins,
        server: sharedServer,
        test: {
          name: 'browser',
          globals: true,
          include: ['packages/**/*.test.browser.{ts,tsx}'],
          server: { deps: sharedServer.deps },
          typecheck: { enabled: true },
          browser: {
            enabled: true,
            provider: playwright({
              launchOptions: {
                executablePath: process.env.CHROMIUM_PATH,
              },
              // Cap Playwright's auto-wait loop. Default is 30s,
              // which means an action against an unactionable element
              // (disabled, off-screen, covered) silently retries until
              // it eats the test budget. 2s is a multiple of any
              // legitimate render/animation we trigger, but tight
              // enough that a misuse fails fast with Playwright's
              // own diagnostic ("element is not enabled", etc.) rather
              // than as a generic vitest timeout.
              actionTimeout: 2_000,
            }),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
