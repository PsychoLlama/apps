import { join } from 'node:path';
import type { NitroModule } from 'nitro/types';
import { injectManifest } from './inject.ts';
import { generateManifest } from './manifest.ts';

/** Options for {@link assetManifest}. */
export interface AssetManifestConfig {
  /**
   * Glob patterns for files to leave out, relative to the public dir
   * (`fonts/*`). Adds to the defaults: `_headers`, `_redirects` and the
   * service worker.
   */
  exclude?: Array<string>;
}

/**
 * Nitro module that builds an asset manifest with SRI hashes and injects
 * it into the service worker. Add it to `modules` in the app's nitro
 * config.
 */
export const assetManifest = (
  config: AssetManifestConfig = {},
): NitroModule => ({
  name: 'asset-manifest',
  setup(nitro) {
    // Prerendering spins up a second nitro instance from the same config,
    // so this runs twice. Only the outer build writes the output.
    if (nitro.options.preset === 'nitro-prerender') return;

    const exclude = [
      // Cloudflare reads these as config; they're never served.
      '_headers',
      '_redirects',

      // Injection changes its bytes, and the browser updates it on its own.
      SERVICE_WORKER_FILE,

      ...(config.exclude ?? []),
    ];

    // `close` fires once the public dir is final: after prerendering, and
    // after the SolidStart plugin deletes the `.vite/` build manifest.
    nitro.hooks.hook('close', async () => {
      if (nitro.options.dev) return;

      const { publicDir } = nitro.options.output;
      const manifest = await generateManifest(publicDir, exclude);

      await injectManifest(join(publicDir, SERVICE_WORKER_FILE), manifest);
    });
  },
});

/** Where the vite plugin emits the worker. */
const SERVICE_WORKER_FILE = 'service-worker.js';
