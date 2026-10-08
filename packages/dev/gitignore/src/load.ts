import ignore, { type Ignore } from 'ignore';

import { queryIgnoreFiles } from './query-ignore-files.ts';
import { readIgnoreFiles } from './read-ignore-files.ts';

/**
 * Builds a matcher from every ignore file git would consult for `cwd`.
 * Rules are added lowest precedence first, so a `.gitignore` negation
 * overrides a global exclude, as in git.
 *
 * Test paths relative to the worktree root, the way git reads them:
 * `ignores('node_modules/')`, not an absolute path.
 */
export const load = async (cwd: string): Promise<Ignore> => {
  const files = await readIgnoreFiles(await queryIgnoreFiles(cwd));

  // One `add` per file: a string is split into lines, but each element of
  // an array is taken as a single pattern, so passing whole files as an
  // array would turn each into one bogus rule.
  return files.reduce((ig, file) => ig.add(file.contents), ignore());
};
