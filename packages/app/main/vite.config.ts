import { defineConfig } from 'vite';
import { nitroV2Plugin as nitro } from '@solidjs/vite-plugin-nitro-2';
import { solidStart } from '@solidjs/start/config';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import Icons from 'unplugin-icons/vite';

export default defineConfig({
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
  plugins: [
    solidStart(),
    nitro({
      preset: 'static',
      prerender: {
        crawlLinks: true,
      },
    }),
    vanillaExtractPlugin(),
    Icons({
      compiler: 'solid',
    }),
  ],
});
