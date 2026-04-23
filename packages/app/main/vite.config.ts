import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { nitroV2Plugin as nitro } from '@solidjs/vite-plugin-nitro-2';
import { solidStart } from '@solidjs/start/config';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import Icons from 'unplugin-icons/vite';
import { generatedArtifacts, scratchDir } from '@dev/build/ignore';

const workspaceRoot = resolve(import.meta.dirname, '../../..');

export default defineConfig({
  server: {
    watch: {
      // Vite's chokidar watcher doesn't respect .gitignore.
      ignored: [...generatedArtifacts, scratchDir(workspaceRoot)],
    },
  },
  plugins: [
    solidStart(),
    nitro({
      preset: 'static',
      prerender: {
        crawlLinks: true,
        routes: ['/404'],
      },
    }),
    vanillaExtractPlugin(),
    Icons({
      compiler: 'solid',
    }),
  ],
});
