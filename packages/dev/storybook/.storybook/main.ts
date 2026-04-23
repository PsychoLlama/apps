import type { StorybookConfig } from 'storybook-solidjs-vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import Icons from 'unplugin-icons/vite';
import { mergeConfig } from 'vite';
import { generatedArtifacts } from '@dev/build/ignore';

// Stories live in sibling workspace packages, not this one. Point
// storybook at the workspace `packages/` directory and let it crawl
// every category/name/src tree. Relative because storybook's vitest
// plugin rejects absolute `directory` values.
const workspacePackages = '../../../../packages';

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
          // Vite's chokidar watcher doesn't respect .gitignore. `.claude`
          // is a worktree-scratch dir, not a generated artifact, so it
          // sits alongside the shared list.
          ignored: [...generatedArtifacts, '**/.claude/**'],
        },
      },
      plugins: [vanillaExtractPlugin(), Icons({ compiler: 'solid' })],
    }),
};

export default config;
