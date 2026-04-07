import type { StorybookConfig } from 'storybook-solidjs-vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-themes'],
  framework: { name: 'storybook-solidjs-vite', options: {} },
  viteFinal: (config) =>
    mergeConfig(config, {
      base: '/__storybook/',
      plugins: [vanillaExtractPlugin()],
    }),
};

export default config;
