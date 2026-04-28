import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import solid from 'vite-plugin-solid';
import Icons from 'unplugin-icons/vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { generatedArtifacts, scratchDir } from '@dev/build/ignore';

const sharedPlugins = [
  solid(),
  Icons({ compiler: 'solid' }),
  vanillaExtractPlugin(),
];

const sharedServer = {
  watch: {
    // Vite's chokidar watcher doesn't respect .gitignore.
    ignored: [...generatedArtifacts, scratchDir(import.meta.dirname)],
  },
  // Inline `@solidjs/*` so vite compiles the raw `.jsx` they publish
  // under their `"solid"` export condition. Upstream:
  // https://github.com/solidjs/vite-plugin-solid/issues/157
  deps: {
    inline: [/@solidjs\//],
  },
};

export default defineConfig({
  test: {
    coverage: {
      include: ['packages/lib/state/src/**/*.ts'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
    projects: [
      {
        plugins: sharedPlugins,
        server: sharedServer,
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          include: ['packages/**/*.test.{ts,tsx}'],
          server: { deps: sharedServer.deps },
          typecheck: { enabled: true },
        },
      },
      {
        plugins: sharedPlugins,
        server: sharedServer,
        test: {
          name: 'browser',
          globals: true,
          include: ['packages/**/*.test.browser.{ts,tsx}'],
          server: { deps: sharedServer.deps },
          typecheck: { enabled: true },
          browser: {
            enabled: true,
            provider: playwright({
              launchOptions: {
                executablePath: process.env.CHROMIUM_PATH,
              },
            }),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
