import type { NitroModule } from 'nitropack/types';

/**
 * Nitro module that emits a precache manifest with SRI hashes for the
 * service worker. Add it to `modules` in the app's nitro config.
 */
export const assetManifest = (): NitroModule => ({
  name: 'asset-manifest',
  setup(nitro) {
    // Prerendering spins up a second nitro instance from the same config,
    // so this runs twice. Only the outer build writes the output.
    if (nitro.options.preset === 'nitro-prerender') return;
  },
});
