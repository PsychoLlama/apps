import { nitro as nitroPlugin, type NitroPluginConfig } from 'nitro/vite';
import type { PluginOption } from 'vite';
import { pageNotFound } from '@dev/nitro-module-page-not-found';
import type { Configure } from './solid.ts';

/** Toggles for the house Nitro modules. Every module is on by default. */
export interface NitroModuleOptions {
  /** Emit the `/404` route as `/404.html` for Cloudflare's 404 handling. */
  pageNotFound?: { enable: boolean };
}

/**
 * Nitro options, with `modules` and `prerender` always present so
 * configure functions can extend the house defaults.
 */
export interface NitroOptions extends NitroPluginConfig {
  modules: NonNullable<NitroPluginConfig['modules']>;
  prerender: NonNullable<NitroPluginConfig['prerender']>;
}

/**
 * Nitro with the house defaults, for apps deployed as static assets on
 * Cloudflare.
 */
export const nitro = (
  configure: Configure<NitroOptions> | undefined,
  modules: NitroModuleOptions,
): PluginOption => {
  const options: NitroOptions = {
    preset: 'static',

    // Cloudflare compresses on the fly and never serves precompressed
    // siblings, so `.br`/`.gz` copies would only upload as stray files.
    compressPublicAssets: false,

    // Prerender every page reachable by links, so apps only list the
    // routes nothing links to.
    prerender: { crawlLinks: true },

    modules: [],
  };

  if (modules.pageNotFound?.enable ?? true) {
    options.modules.push(pageNotFound());
  }

  configure?.(options);

  return nitroPlugin(options);
};
