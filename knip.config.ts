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
        'src/routes/**/*.tsx',
        'src/app.tsx',
        'src/entry-{client,server}.tsx',
        'src/**/*.test.{ts,tsx}',
        'src/__tests__/test-utils.tsx',
        'vite.config.ts',
      ],
      project: ['src/**/*.{ts,tsx}'],
      ignoreDependencies: [
        '@iconify/json', // used implicitly by unplugin-icons
      ],
      // `@solidjs/start` reads app.tsx from cwd, which points at the
      // workspace root when knip runs holistically. Skip knip's vite
      // auto-discovery; the entry list above is the source of truth.
      vite: false,
    },
    'packages/dev/storybook': {
      entry: [
        '.storybook/*.ts',
        // `*.story-test.tsx` files run via storybook addon-vitest in
        // Playwright, not the root jsdom vitest pass.
        'src/**/__tests__/*.story-test.{ts,tsx}',
      ],
      project: ['.storybook/*.ts', 'src/**/__tests__/*.story-test.{ts,tsx}'],
      ignoreDependencies: [
        '@iconify/json', // used implicitly by unplugin-icons
        // `storybook/test`'s `.d.ts` re-exports `TestingLibraryMatchers`
        // from `@testing-library/jest-dom/matchers` for matchers like
        // `.toHaveFocus()`. Needed at type-check time even though no
        // source imports it directly.
        '@testing-library/jest-dom',
        // Some sibling packages are pulled in indirectly (e.g. via
        // theme imports in `.storybook/preview.ts`) rather than by
        // direct story imports.
        '@app/studio',
        '@lib/shell',
        '@vanilla-extract/css',
      ],
    },
  },
};

export default config;
