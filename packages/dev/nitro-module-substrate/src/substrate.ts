import type { NitroModule } from 'nitro/types';
import { pageNotFound } from './page-not-found.ts';

/** Options for {@link substrate}. Every feature is on by default. */
export interface SubstrateConfig {
  /** Emit the `/404` route as `/404.html` for Cloudflare's 404 handling. */
  pageNotFound?: { enable: boolean };
}

/**
 * Nitro module for apps deployed as static assets on Cloudflare. Add it to
 * `modules` in the app's nitro config.
 */
export const substrate = (config: SubstrateConfig = {}): NitroModule => ({
  name: 'substrate',
  setup(nitro) {
    // Prerendering spins up a second nitro instance from the same config,
    // so this runs twice. Only the outer build writes the output.
    if (nitro.options.preset === 'nitro-prerender') return;

    // Cloudflare compresses on the fly and never serves precompressed
    // siblings, so `.br`/`.gz` copies would only upload as stray files.
    nitro.options.compressPublicAssets = false;

    // Prerender every page reachable by links, so apps only list the
    // routes nothing links to.
    nitro.options.prerender.crawlLinks = true;

    if (config.pageNotFound?.enable ?? true) {
      pageNotFound(nitro);
    }
  },
});
