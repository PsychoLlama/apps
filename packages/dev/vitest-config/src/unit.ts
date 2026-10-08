/**
 * The workspace's unit-suite config, re-exported verbatim as each package's
 * `vitest.unit.config.ts` default. Vitest scopes its root to the cwd (the
 * package directory turbo runs `test:unit` in), so the relative `include` below
 * only matches the invoking package's unit tests — and turbo caches each
 * package's run against its own inputs instead of rerunning the whole
 * monorepo on every change.
 */

import { defineConfig } from 'vitest/config';
import { generatedArtifacts } from '@dev/vitest-config/ignore';

// Self-reference through the package's own export map rather than a relative
// path: this file is loaded by vitest's node-ESM config loader (not the
// bundler), where an extensionless `./index` won't resolve.
import { sharedPlugins, sharedServerDeps } from '@dev/vitest-config';

export default defineConfig({
  plugins: sharedPlugins(),
  server: {
    // Vite's chokidar watcher doesn't respect .gitignore.
    watch: { ignored: [...generatedArtifacts] },
  },
  test: {
    name: 'unit',
    environment: 'jsdom',
    globals: true,
    // Pin the suite to UTC so anything touching `Date`/`Intl` behaves
    // identically across dev machines and CI, independent of the host's
    // local timezone.
    env: { TZ: 'UTC' },
    // Default is 15s. Tighter budget surfaces accidental slowness (e.g.
    // tests waiting on Playwright actionability checks against an
    // unactionable element) before it racks up wall-clock. The slowest
    // legitimate test is well under 1s; 5s leaves an order of magnitude
    // of headroom.
    testTimeout: 5_000,
    include: ['src/**/*.test.{ts,tsx}'],
    server: { deps: sharedServerDeps },
    typecheck: { enabled: true },
  },
});
