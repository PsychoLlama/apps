import type { Plugin, ResolvedConfig } from 'vite';

/**
 * Vite plugin that fails the build if any Rollup output filename
 * template is missing `[hash]`. Backstop for long-cache headers we
 * set on content-addressed bundle paths — if a config tweak ever
 * drops the hash placeholder, the build halts before shipping assets
 * the browser would cache forever under reusable names.
 *
 * Verifies the resolved templates rather than the produced filenames
 * because "is this string a hash?" has no reliable answer.
 *
 * Skips SSR builds — server bundles aren't browser-cached.
 */
export const assertHashedAssetNames = (): Plugin => {
  let resolvedConfig: ResolvedConfig | null = null;

  return {
    name: '@dev/build:assert-hashed-asset-names',
    apply: 'build',

    configResolved(config) {
      resolvedConfig = config;
    },

    renderStart(outputOptions) {
      if (resolvedConfig?.build.ssr) return;

      const templates = {
        entryFileNames: outputOptions.entryFileNames,
        chunkFileNames: outputOptions.chunkFileNames,
        assetFileNames: outputOptions.assetFileNames,
      };

      for (const [key, value] of Object.entries(templates)) {
        if (typeof value === 'function') {
          this.error(
            `${key} is a function — cannot statically verify it produces hashed filenames. Use a string template containing [hash], or remove this plugin if you've verified the function is safe.`,
          );
        }

        if (!value.includes('[hash]')) {
          this.error(
            `${key} = "${value}" must contain [hash]. Long-cache headers on these assets would otherwise serve stale content under reused names.`,
          );
        }
      }
    },
  };
};
