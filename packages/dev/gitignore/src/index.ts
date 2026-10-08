/**
 * Git's ignore rules for dev tooling. Watchers and linters that don't
 * read `.gitignore` on their own can skip the same files git does,
 * including rules from the clone's `info/exclude` and the user's global
 * excludes file.
 */

export {
  discoverIgnoreFiles,
  type IgnoreFileLocation,
  type IgnoreSource,
} from './discover-ignore-files.ts';
export { loadGitignore } from './load-gitignore.ts';
export { readIgnoreFiles, type IgnoreFile } from './read-ignore-files.ts';
