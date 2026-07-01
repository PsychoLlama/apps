import { defineConfig } from 'vitest/config';
import { generatedArtifacts, scratchDir } from '@dev/build/ignore';
import { sharedPlugins, sharedServerDeps } from '@dev/vitest-config';

const sharedServer = {
  watch: {
    // Vite's chokidar watcher doesn't respect .gitignore.
    ignored: [...generatedArtifacts, scratchDir(import.meta.dirname)],
  },
  deps: sharedServerDeps,
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
    // Only the unit suite runs centrally. Browser tests are split per
    // package (each owns a `vitest.browser.config.ts` re-exporting the
    // shared preset) so turbo reruns them per package and `chromium-lock`
    // serializes Chromium — rather than booting a browser for the whole
    // monorepo on every change.
    projects: [
      {
        plugins: sharedPlugins(),
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
    ],
  },
});
