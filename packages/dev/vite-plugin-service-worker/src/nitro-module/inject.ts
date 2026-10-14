import { readFile, writeFile } from 'node:fs/promises';
import { assert } from '@lib/assert';
import { OFFLINE_MANIFEST_SENTINEL } from '../constants.ts';
import type { OfflineManifest } from '../types.d.ts';

/**
 * Swaps the manifest into the built service worker, if there is one. Fails
 * unless the sentinel appears exactly once, so a minifier rewrite or a
 * second reader can't silently ship a worker without its manifest.
 */
export const injectManifest = async (
  workerPath: string,
  manifest: OfflineManifest,
) => {
  const source = await readWorker(workerPath);
  if (source === null) return;

  const parts = source.split(OFFLINE_MANIFEST_SENTINEL);
  assert(
    parts.length === 2,
    `Expected one "${OFFLINE_MANIFEST_SENTINEL}" in ${workerPath}, found ${parts.length - 1}.`,
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
