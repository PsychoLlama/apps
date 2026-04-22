import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['.storybook/*.ts', 'src/**/*.css.ts'],
  project: ['src/**/*.{ts,tsx}'],
  ignoreDependencies: [
    '@iconify/json', // used implicitly by unplugin-icons
    // Stories live in sibling packages and pull these in via
    // `packages/*/*/src/**/*.stories.*`. They must be declared here
    // so pnpm installs them into this package's node_modules, where
    // vite looks when transforming stories.
    '@app/studio',
    '@lib/shell',
    '@lib/ui',
    '@solidjs/router',
    '@vanilla-extract/css',
  ],
  ignoreExportsUsedInFile: true,
};

export default config;
