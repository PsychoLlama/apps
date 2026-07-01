import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignoreExportsUsedInFile: true,
  // chromium-lock is provided by the nix devShell (a flake wrapper around
  // s6-setlock), not pnpm. The per-package `test:browser` scripts wrap vitest
  // in it to serialize Chromium.
  ignoreBinaries: ['chromium-lock'],
  workspaces: {
    '.': {
      entry: ['*.ts'],
      project: ['*.ts'],
      // treefmt is provided by the nix devShell, not pnpm, but the
      // root `fmt`/`fmt-check` scripts shell out to it.
      ignoreBinaries: ['treefmt'],
      ignoreDependencies: [
        'prettier', // invoked by treefmt
        '@vanilla-extract/css', // referenced by name in eslint.config.ts
        // Hoisted here so web packages resolve the icon data
        // `unplugin-icons` pulls in at runtime; not imported by name at
        // the root itself.
        '@iconify/json',
      ],
    },
    'packages/app/main': {
      // `!` on entries marks them as production-mode entries. These
      // runtime files are what `knip --production` walks to find
      // exports that are only kept alive by tests or build glue.
      // Sibling `.css.ts` files are reached via `import './foo.css'`
      // from their `.tsx`, but knip's resolver doesn't follow the
      // V-E `.css` -> `.css.ts` extension swap. Marking them as
      // production entries credits the design tokens they pull in.
      entry: [
        'src/routes/**/*.tsx!',
        'src/app.tsx!',
        'src/entry-{client,server}.tsx!',
        'src/**/*.css.ts!',
        'src/**/*.test.{ts,tsx}',
        'vite.config.ts',
      ],
      // Project files need the production marker too: without it,
      // non-entry modules reached from production entries (e.g.
      // `branding/`) are skipped by `--production`, and the
      // dependencies only they import get reported as unused.
      project: ['src/**/*.{ts,tsx}!'],
      ignoreDependencies: [
        '@iconify/json', // used implicitly by unplugin-icons
        // Imported as `@app/service-worker?worker&url`; the query
        // suffix hides the specifier from knip's resolver.
        '@app/service-worker',
        // Listed directly so Vite's dep scanner picks it up at
        // startup; without it, the transitive import (via
        // `@vanilla-extract/css` from `@lib/ui`) is discovered
        // mid-load and triggers a re-optimize that 504s in-flight
        // requests — most visibly killing the service worker fetch.
        '@vanilla-extract/dynamic',
      ],
      // `@solidjs/start` reads app.tsx from cwd, which points at the
      // workspace root when knip runs holistically. Skip knip's vite
      // auto-discovery; the entry list above is the source of truth.
      vite: false,
    },
    'packages/lib/ui': {
      // Co-located behavior tests run against a real browser via the
      // per-package `vitest.browser.config.ts`. The default knip
      // detection only picks up `*.test.{ts,tsx}` files.
      entry: [
        'vitest.browser.config.ts',
        'src/**/__tests__/*.test.browser.{ts,tsx}',
      ],
      project: ['src/**/*.{ts,tsx}'],
      ignoreDependencies: [
        // `--production` walks @lib/ui transitively via @app/main, but
        // dep checks are per-workspace and the built-in vanilla-extract
        // plugin only auto-credits `@vanilla-extract/css`. Spell the
        // dynamic counterpart out so production mode doesn't see it as
        // unused. Imported at runtime by `progress.tsx` for
        // `assignInlineVars`.
        '@vanilla-extract/dynamic',
      ],
    },
    'crates/qr-scanner': {
      // The build script shells out to `wasm-bindgen` (the CLI) to
      // generate JS glue; it's provided by the nix devShell, not pnpm.
      ignoreBinaries: ['wasm-bindgen'],
    },
    'packages/app/service-worker': {
      // Cache Storage + `FetchEvent` only exist in a real browser, so
      // the SW behavior tests live under `*.test.browser.ts`.
      entry: [
        'vitest.browser.config.ts',
        'src/**/__tests__/*.test.browser.{ts,tsx}',
      ],
    },
    'packages/app/logs': {
      // The viewer's archive read drives real IndexedDB, so its behavior
      // tests live under `*.test.browser.ts`.
      entry: [
        'vitest.browser.config.ts',
        'src/**/__tests__/*.test.browser.{ts,tsx}',
      ],
    },
    'packages/lib/holz-idb-backend': {
      // IndexedDB is only real in a browser, so the backend's behavior
      // tests live under `*.test.browser.ts`, run via the per-package
      // browser config.
      entry: [
        'vitest.browser.config.ts',
        'src/**/__tests__/*.test.browser.{ts,tsx}',
      ],
    },
    'packages/dev/vitest-config': {
      // Deps the shared preset pulls in by side effect rather than by a
      // named import, so knip can't see them: the browser-mode runtime and
      // the icon data `unplugin-icons` resolves at runtime.
      ignoreDependencies: ['@vitest/browser', '@iconify/json'],
    },
    'packages/lib/runtime-config': {
      // OPFS is only real in a browser, so the persistence round-trip
      // tests live under `*.test.browser.ts`.
      entry: [
        'vitest.browser.config.ts',
        'src/**/__tests__/*.test.browser.{ts,tsx}',
      ],
    },
  },
};

export default config;
