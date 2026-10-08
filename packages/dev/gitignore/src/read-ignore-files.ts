import { readFile } from 'node:fs/promises';

import type {
  IgnoreFileLocation,
  IgnoreSource,
} from './discover-ignore-files.ts';

/** The raw contents of one ignore file. */
export interface IgnoreFile {
  source: IgnoreSource;
  fileContents: string;
}

/**
 * Reads ignore files in parallel, typically from `discoverIgnoreFiles`.
 * Files that are missing or unreadable are skipped; the rest keep their
 * input order, so precedence carries through.
 */
export const readIgnoreFiles = async (
  locations: readonly IgnoreFileLocation[],
): Promise<IgnoreFile[]> => {
  const files = await Promise.all(
    locations.map(async ({ source, path }) => {
      const fileContents = await readFile(path, 'utf8').catch(() => null);
      return fileContents === null ? null : { source, fileContents };
    }),
  );

  return files.filter((file) => file !== null);
};
