import type { StorybookConfig } from 'storybook-solidjs-vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-themes', '@storybook/addon-vitest'],
  framework: { name: 'storybook-solidjs-vite', options: {} },
  core: { disableWhatsNewNotifications: true },
  features: { sidebarOnboardingChecklist: false },
  viteFinal: (config) =>
    mergeConfig(config, {
      ...(process.env.NODE_ENV === 'production' && { base: '/__storybook/' }),
      plugins: [vanillaExtractPlugin()],
    }),
};

export default config;
