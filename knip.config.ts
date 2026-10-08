import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignoreExportsUsedInFile: true,
  // chromium-lock is provided by the nix devShell (a flake wrapper around
  // s6-setlock), not pnpm. The per-package `test:browser` scripts wrap vitest
  // in it to serialize Chromium.
  ignoreBinaries: ['chromium-lock'],
  // Each package runs its own suites from `vitest.{unit,browser}.config.ts`
  // (re-exporting the `@dev/vitest-config` presets). Packages don't list
  // `vitest` themselves (its binary comes from the root), so the plugin
  // must be enabled explicitly to credit the configs and test files.
  vitest: {
    config: ['vitest.{unit,browser}.config.ts'],
    entry: ['src/**/*.test.{ts,tsx}', 'src/**/*.test.browser.{ts,tsx}'],
  },
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
        // Imported as `./service-worker?worker&url`; the query suffix
        // hides the specifier from knip's resolver.
        'src/service-worker/index.ts!',
        'src/**/*.css.ts!',
        'vite.config.ts',
      ],
      // Project files need the production marker too: without it,
      // non-entry modules reached from production entries (e.g.
      // `branding/`) are skipped by `--production`, and the
      // dependencies only they import get reported as unused.
      project: ['src/**/*.{ts,tsx}!'],
      ignoreDependencies: [
        '@iconify/json', // used implicitly by unplugin-icons
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
      entry: [
        // `_internal/*` primitives (e.g. floating-ui and its behavior
        // utilities) are a deliberate private API: fully built and
        // tested, but not yet wired to a public consumer
        // (Tooltip/Popover) or the `@lib/ui` barrel. Treat them as
        // entries so their staged exports aren't flagged.
        'src/components/_internal/**/*.{ts,tsx}!',
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
    'crates/qr-code': {
      // The build script shells out to `wasm-bindgen` (the CLI) to
      // generate JS glue; it's provided by the nix devShell, not pnpm.
      ignoreBinaries: ['wasm-bindgen'],
    },
    'packages/dev/gitignore': {
      // Shared test fixtures live beside the tests. They aren't named
      // `*.test.ts`, so exclude them from production analysis explicitly.
      project: ['src/**/*.ts!', '!src/__tests__/**!'],
    },
    'packages/dev/vitest-config': {
      // Deps the shared preset pulls in by side effect rather than by a
      // named import, so knip can't see them: the browser-mode runtime and
      // the icon data `unplugin-icons` resolves at runtime.
      ignoreDependencies: ['@vitest/browser', '@iconify/json'],
    },
  },
};

export default config;
