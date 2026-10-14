import { createHash } from 'node:crypto';
import { glob, open } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { assert } from '@lib/assert';
import type { AssetManifest } from '../types.d.ts';

/**
 * Hashes every file under `publicDir`, skipping glob patterns in `exclude`
 * (relative to `publicDir`).
 */
export const generateAssets = async (
  publicDir: string,
  exclude: Array<string>,
): Promise<AssetManifest['assets']> => {
  // Nitro may hand over the dir with a trailing slash. Without one, every
  // file is a plain prefix away from its `/`-led key.
  const root = resolve(publicDir);
  const files = await listFiles(root, exclude);
  const hashes = await Promise.all(files.map(integrity));
  const assets = Object.fromEntries(
    files.map((file, index) => [file.slice(root.length), hashes[index]]),
  );

  assert(
    hasNotFoundPage(assets),
    `The build has no ${NOT_FOUND_PAGE}. The service worker serves it for unknown paths.`,
  );

  return assets;
};

/** Served for unknown paths, by Cloudflare and the service worker alike. */
const NOT_FOUND_PAGE = '/404.html';

const hasNotFoundPage = (
  assets: Record<string, string>,
): assets is AssetManifest['assets'] => Object.hasOwn(assets, NOT_FOUND_PAGE);

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
