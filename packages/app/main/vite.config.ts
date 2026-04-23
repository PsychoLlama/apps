import { defineConfig } from 'vite';
import { nitroV2Plugin as nitro } from '@solidjs/vite-plugin-nitro-2';
import { solidStart } from '@solidjs/start/config';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import Icons from 'unplugin-icons/vite';
import { generatedArtifacts } from '@dev/build/ignore';

export default defineConfig({
  server: {
    watch: {
      // Vite's chokidar watcher doesn't respect .gitignore. `.claude`
      // is a worktree-scratch dir, not a generated artifact, so it
      // sits alongside the shared list.
      ignored: [...generatedArtifacts, '**/.claude/**'],
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
