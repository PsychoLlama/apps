import { createHash } from 'node:crypto';
import { glob, open, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { NitroModule } from 'nitropack/types';

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
 * Every deployed file, keyed by its path from the public dir root, with an
 * SRI token (`sha256-…`) for `new Request(url, { integrity })`.
 */
export interface AssetManifest {
  assets: Record<string, string>;
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

    const exclude = [...DEFAULT_EXCLUDE, ...(config.exclude ?? [])];

    // `close` fires once the public dir is final: after prerendering, and
    // after the SolidStart plugin deletes the `.vite/` build manifest.
    nitro.hooks.hook('close', async () => {
      if (nitro.options.dev) return;

      const { publicDir } = nitro.options.output;
      const files = await listFiles(publicDir, exclude);
      const hashes = await Promise.all(files.map(integrity));

      const manifest: AssetManifest = {
        assets: Object.fromEntries(
          files.map((file, index) => [
            file.slice(publicDir.length),
            hashes[index],
          ]),
        ),
      };

      await writeFile(
        join(publicDir, MANIFEST_FILE),
        `${JSON.stringify(manifest, null, 2)}\n`,
      );
    });
  },
});

/** Where the manifest is served, relative to the app root. */
export const MANIFEST_FILE = 'asset-manifest.json';

const DEFAULT_EXCLUDE = [
  // Cloudflare reads these as config; they're never served.
  '_headers',
  '_redirects',

  // The web app manifest.
  'manifest.webmanifest',

  // The manifest can't list its own hash.
  MANIFEST_FILE,
];

/** Every file in the public dir as a sorted absolute path. */
const listFiles = async (publicDir: string, exclude: Array<string>) => {
  // Glob absolute patterns so results come back absolute too, ready to read
  // and a plain prefix away from their manifest key.
  const entries = await Array.fromAsync(
    glob(join(publicDir, '**/*'), {
      exclude: exclude.map((pattern) => join(publicDir, pattern)),
      withFileTypes: true,
    }),
  );

  // Glob order isn't stable. Sort so identical builds emit identical bytes.
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();
};

/** Streams the file through SHA-256 to build an SRI token. */
const integrity = async (filePath: string) => {
  const hash = createHash('sha256');
  const handle = await open(filePath);

  // The stream closes the handle once it's drained.
  for await (const chunk of handle.createReadStream()) {
    hash.update(chunk as Buffer);
  }

  return `sha256-${hash.digest('base64')}`;
};
