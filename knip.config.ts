import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignoreExportsUsedInFile: true,
  workspaces: {
    '.': {
      entry: ['*.ts'],
      project: ['*.ts'],
      ignoreDependencies: [
        'prettier', // invoked by treefmt
        '@vanilla-extract/css', // referenced by name in eslint.config.ts
        '@iconify/json', // resolved at runtime by unplugin-icons in vitest.config.ts
        '@dev/workspace-cli', // declared so pnpm links the `workspace` bin into node_modules/.bin
      ],
    },
    'packages/app/main': {
      entry: [
        'src/routes/**/*.tsx!',
        'src/app.tsx!',
        'src/entry-{client,server}.tsx!',
        'src/**/*.test.{ts,tsx}',
        'src/__tests__/test-utils.tsx',
        'vite.config.ts',
      ],
      project: ['src/**/*.{ts,tsx}!'],
      ignoreDependencies: [
        '@iconify/json', // used implicitly by unplugin-icons
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
      // Exclude `__tests__/` directories from production project
      // analysis so test-only fixtures (helpers, scoped CSS) don't
      // get flagged as unused. They stay reachable in default mode
      // via the entry above.
      project: ['src/**/*.{ts,tsx}!', '!src/**/__tests__/**!'],
    },
    'packages/dev/storybook': {
      // The storybook plugin contributes entries (stories, .storybook/*)
      // as dev-only, so `--production` filters them out and the
      // workspace's deps appear unused. Disable the plugin and let the
      // explicit entries below — marked with `!` — drive both modes.
      storybook: false,
      entry: ['.storybook/*.ts!', 'src/**/*.stories.tsx!'],
      project: ['.storybook/*.ts!', 'src/**/*.{ts,tsx}!'],
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
