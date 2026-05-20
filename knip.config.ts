import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignoreExportsUsedInFile: true,
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
        '@iconify/json', // resolved at runtime by unplugin-icons in vitest.config.ts
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
        'src/__tests__/test-utils.tsx',
        'vite.config.ts',
      ],
      project: ['src/**/*.{ts,tsx}'],
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
      // root vitest config's `browser` project (playwright). The
      // default knip detection only picks up `*.test.{ts,tsx}` files.
      entry: ['src/**/__tests__/*.test.browser.{ts,tsx}'],
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
    'packages/app/studio': {
      // Same browser-test caveat as @lib/ui — OPFS only exists in a
      // real browser, so the library capabilities tests live under
      // `*.test.browser.ts`.
      entry: ['src/**/__tests__/*.test.browser.{ts,tsx}'],
    },
    'packages/app/service-worker': {
      // Cache Storage + `FetchEvent` only exist in a real browser, so
      // the SW behavior tests live under `*.test.browser.ts`.
      entry: ['src/**/__tests__/*.test.browser.{ts,tsx}'],
    },
    'packages/dev/storybook': {
      entry: ['.storybook/*.ts'],
      project: ['.storybook/*.ts', 'src/**/*.{ts,tsx}'],
      ignoreDependencies: [
        '@iconify/json', // used implicitly by unplugin-icons
        // Some sibling packages are pulled in indirectly (e.g. via
        // theme imports in `.storybook/preview.ts`) rather than by
        // direct story imports.
        '@app/studio',
        '@lib/shell',
      ],
    },
  },
};

export default config;
