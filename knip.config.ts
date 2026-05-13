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
        // Knip's Panda plugin infers `postcss` as a runtime peer of
        // `@pandacss/dev`. We never import it directly — the postcss
        // plugin pulls it in transitively, so listing it would be
        // misleading.
        'postcss',
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
      ],
      // `@solidjs/start` reads app.tsx from cwd, which points at the
      // workspace root when knip runs holistically. Skip knip's vite
      // auto-discovery; the entry list above is the source of truth.
      vite: false,
    },
    'packages/lib/theme': {
      // `index.ts` is auto-discovered as a non-production entry via
      // `package.json#exports`, so dev-mode knip walks it and credits
      // its imports. Marking it `!` to upgrade to a production entry
      // gets deduped against the auto-discovered copy and the `!` is
      // dropped — which means `--production` never reaches
      // `theme-store.ts` and `@lib/state` looks unused. List
      // `theme-store.ts!` directly so the production walker enters
      // through the file that imports `@lib/state`.
      //
      // Each `bundles/<accent>.css.ts` is library surface — exposed
      // through the `./bundles/*` subpath export and reached via
      // `import url from '@lib/theme/bundles/<accent>.css.ts?css-asset'`
      // (handled by `@dev/build/vite-plugin/css-asset`). Only the
      // default is consumed today; keep the rest alive in knip until
      // a host wires them up.
      entry: ['src/theme-store.ts!', 'src/bundles/*.css.ts!'],
      project: ['src/**/*.{ts,tsx}'],
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
