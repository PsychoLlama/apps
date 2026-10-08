import { readFile } from 'node:fs/promises';

import type { IgnoreFile } from './query-ignore-files.ts';

/** An ignore file along with its raw contents. */
export interface LoadedIgnoreFile extends IgnoreFile {
  contents: string;
}

/**
 * Reads ignore files in parallel, typically from `queryIgnoreFiles`.
 * Files that are missing or unreadable are skipped; the rest keep their
 * input order, so precedence carries through.
 */
export const readIgnoreFiles = async (
  files: readonly IgnoreFile[],
): Promise<LoadedIgnoreFile[]> => {
  const loaded = await Promise.all(
    files.map(async (file) => {
      const contents = await readFile(file.path, 'utf8').catch(() => null);
      return contents === null ? null : { ...file, contents };
    }),
  );

  return loaded.filter((file) => file !== null);
};
