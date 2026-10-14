import { join } from 'node:path';
import type { NitroModule } from 'nitro/types';
import { SERVICE_WORKER_FILE_NAME } from '../constants.ts';
import type { OfflineManifest } from '../types.d.ts';
import { injectManifest } from './inject.ts';
import { generateAssets } from './assets.ts';

/**
 * Nitro module that builds an offline manifest with SRI hashes and injects
 * it into the built service worker. `getRedirects` is read once the build
 * is done.
 */
export const offlineManifest = (
  getRedirects: () => readonly string[],
): NitroModule => ({
  name: 'offline-manifest',
  setup(nitro) {
    // Prerendering spins up a second nitro instance from the same config,
    // so this runs twice. Only the outer build writes the output.
    if (nitro.options.preset === 'nitro-prerender') return;

    const exclude = [
      // Cloudflare reads these as config; they're never served.
      '_headers',
      '_redirects',

      // Injection changes its bytes, and the browser updates it on its own.
      SERVICE_WORKER_FILE_NAME,
    ];

    // `close` fires once the public dir is final: after prerendering, and
    // after the SolidStart plugin deletes the `.vite/` build manifest.
    nitro.hooks.hook('close', async () => {
      if (nitro.options.dev) return;

      const { publicDir } = nitro.options.output;
      const manifest: OfflineManifest = {
        assets: await generateAssets(publicDir, exclude),
        redirects: [...getRedirects()],
      };

      await injectManifest(join(publicDir, SERVICE_WORKER_FILE_NAME), manifest);
    });
  },
});
