import { readFile, writeFile } from 'node:fs/promises';
import { assert } from '@lib/assert';
import type { AssetManifest } from './types.d.ts';

/**
 * Swaps the manifest into the built service worker, if there is one. Fails
 * unless the sentinel appears exactly once, so a minifier rewrite or a
 * second reader can't silently ship a worker without its manifest.
 */
export const injectManifest = async (
  workerPath: string,
  manifest: AssetManifest,
) => {
  const source = await readWorker(workerPath);
  if (source === null) return;

  const parts = source.split(SENTINEL);
  assert(
    parts.length === 2,
    `Expected one "${SENTINEL}" in ${workerPath}, found ${parts.length - 1}.`,
  );

  // Parenthesized so it stays an expression where a `{` would open a block,
  // like an arrow function body.
  await writeFile(workerPath, parts.join(`(${JSON.stringify(manifest)})`));
};

/** Apps without a service worker have nothing to inject. */
const readWorker = async (workerPath: string) => {
  try {
    return await readFile(workerPath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
};

/** Read by `@lib/service-worker`. See `types.d.ts`. */
const SENTINEL = 'globalThis.__ASSET_MANIFEST__';
