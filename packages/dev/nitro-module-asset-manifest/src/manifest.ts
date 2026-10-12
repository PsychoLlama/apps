import { createHash } from 'node:crypto';
import { glob, open } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Every deployed file, keyed by its path from the public dir root, with an
 * SRI token (`sha256-…`) for `new Request(url, { integrity })`.
 */
export interface AssetManifest {
  assets: Record<string, string>;
}

/**
 * Hashes every file under `publicDir`, skipping glob patterns in `exclude`
 * (relative to `publicDir`).
 */
export const generateManifest = async (
  publicDir: string,
  exclude: Array<string>,
): Promise<AssetManifest> => {
  const files = await listFiles(publicDir, exclude);
  const hashes = await Promise.all(files.map(integrity));

  return {
    assets: Object.fromEntries(
      files.map((file, index) => [file.slice(publicDir.length), hashes[index]]),
    ),
  };
};

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
