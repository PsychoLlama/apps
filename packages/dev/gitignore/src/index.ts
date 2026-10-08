/**
 * Git's ignore rules for dev tooling. Watchers and linters that don't
 * read `.gitignore` on their own can skip the same files git does,
 * including rules from the clone's `info/exclude` and the user's global
 * excludes file.
 */

export {
  queryIgnoreFiles,
  type IgnoreFile,
  type IgnoreScope,
} from './query-ignore-files.ts';
export { readIgnoreFiles, type LoadedIgnoreFile } from './read-ignore-files.ts';
export { load } from './load.ts';
