import { resolve } from 'node:path';
import type { StorybookConfig } from 'storybook-solidjs-vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import Icons from 'unplugin-icons/vite';
import { mergeConfig } from 'vite';
import { generatedArtifacts, scratchDir } from '@dev/build/ignore';
import { instrumentationScope } from '@dev/build/vite-plugin/instrumentation-scope';

const workspaceRoot = '../../../..';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-themes', '@storybook/addon-vitest'],
  framework: {
    name: 'storybook-solidjs-vite',
    options: { docgen: false },
  },
  core: { disableWhatsNewNotifications: true },
  features: { sidebarOnboardingChecklist: false },
  viteFinal: (config) =>
    mergeConfig(config, {
      ...(process.env.NODE_ENV === 'production' && { base: '/__storybook/' }),
      server: {
        watch: {
          // Vite's chokidar watcher doesn't respect .gitignore.
          ignored: [
            ...generatedArtifacts,
            scratchDir(resolve(import.meta.dirname, workspaceRoot)),
          ],
        },
      },
      plugins: [
        instrumentationScope(),
        vanillaExtractPlugin(),
        Icons({ compiler: 'solid' }),
      ],
    }),
};

export default config;
