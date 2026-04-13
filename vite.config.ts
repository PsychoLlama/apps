import { defineConfig } from 'vite';
import { nitroV2Plugin as nitro } from '@solidjs/vite-plugin-nitro-2';
import { solidStart } from '@solidjs/start/config';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import Icons from 'unplugin-icons/vite';
import { watchIgnore } from './vite-ignored';

export default defineConfig({
  server: {
    watch: {
      ignored: watchIgnore,
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
