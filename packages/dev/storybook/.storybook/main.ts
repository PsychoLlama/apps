import type { StorybookConfig } from 'storybook-solidjs-vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import Icons from 'unplugin-icons/vite';
import { mergeConfig } from 'vite';
import { existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

// Walk up from the config dir until we find the pnpm workspace
// manifest, then emit a relative path to `packages/`. Relative
// because storybook's vitest plugin rejects absolute `directory`
// values.
const findWorkspaceRoot = (start: string): string => {
  let dir = start;
  while (dir !== dirname(dir)) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) return dir;
    dir = dirname(dir);
  }
  throw new Error(`pnpm-workspace.yaml not found above ${start}`);
};

const workspacePackages = relative(
  import.meta.dirname,
  resolve(findWorkspaceRoot(import.meta.dirname), 'packages'),
);

const config: StorybookConfig = {
  stories: [
    {
      directory: workspacePackages,
      files: '*/*/src/**/*.stories.@(ts|tsx)',
    },
  ],
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
          // Vite's chokidar watcher does not respect .gitignore. Build
          // artifacts and tool directories must be excluded explicitly.
          ignored: [
            '**/.direnv/**',
            '**/.claude/**',
            '**/.nitro/**',
            '**/.output/**',
            '**/.wrangler/**',
            '**/storybook-static/**',
            '**/result*/**',
          ],
        },
      },
      plugins: [vanillaExtractPlugin(), Icons({ compiler: 'solid' })],
    }),
};

export default config;
