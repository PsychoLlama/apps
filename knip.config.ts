import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'src/routes/**/*.tsx',
    'src/app.tsx',
    'src/entry-{client,server}.tsx',
    '.storybook/*.ts',
    'src/**/*.stories.tsx',
  ],
  project: ['src/**/*.{ts,tsx}'],
  ignoreDependencies: [
    '@iconify/json', // used implicitly by unplugin-icons
    'wrangler', // used by GitHub Actions CI
  ],
  ignoreExportsUsedInFile: true,
};

export default config;
