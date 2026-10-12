import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { NitroModule } from 'nitropack/types';
import { generateManifest } from './manifest.ts';

/** Options for {@link assetManifest}. */
export interface AssetManifestConfig {
  /**
   * Glob patterns for files to leave out, relative to the public dir
   * (`fonts/*`). Adds to the defaults: `_headers`, `_redirects` and
   * `manifest.webmanifest`.
   */
  exclude?: Array<string>;
}

/**
 * Nitro module that emits a precache manifest with SRI hashes for the
 * service worker. Add it to `modules` in the app's nitro config.
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

      // The web app manifest.
      'manifest.webmanifest',

      // The manifest can't list its own hash.
      MANIFEST_FILE,

      ...(config.exclude ?? []),
    ];

    // `close` fires once the public dir is final: after prerendering, and
    // after the SolidStart plugin deletes the `.vite/` build manifest.
    nitro.hooks.hook('close', async () => {
      if (nitro.options.dev) return;

      const { publicDir } = nitro.options.output;
      const manifest = await generateManifest(publicDir, exclude);

      await writeFile(
        join(publicDir, MANIFEST_FILE),
        `${JSON.stringify(manifest, null, 2)}\n`,
      );
    });
  },
});

/** Where the manifest is served, relative to the app root. */
export const MANIFEST_FILE = 'asset-manifest.json';
