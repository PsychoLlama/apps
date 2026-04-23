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
      ],
    },
    'packages/app/main': {
      entry: [
        'src/routes/**/*.tsx',
        'src/app.tsx',
        'src/entry-{client,server}.tsx',
        'src/**/*.test.{ts,tsx}',
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
      entry: ['.storybook/*.ts'],
      project: ['.storybook/*.ts'],
      ignoreDependencies: [
        '@iconify/json', // used implicitly by unplugin-icons
        // Stories live in sibling packages and pull these in via
        // `packages/*/*/src/**/*.stories.*`. They must be declared
        // here so pnpm installs them into this package's
        // node_modules, where vite looks when transforming stories.
        '@app/studio',
        '@lib/shell',
        '@lib/ui',
        '@solidjs/router',
        '@vanilla-extract/css',
      ],
    },
  },
};

export default config;
