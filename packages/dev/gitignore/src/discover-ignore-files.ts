import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

import { git } from './git.ts';

/**
 * Where git reads an ignore file from, per `gitignore(5)`:
 *
 * - `global`: `core.excludesFile`, or `$XDG_CONFIG_HOME/git/ignore`.
 * - `local`: `$GIT_DIR/info/exclude`, shared by every worktree of a clone.
 * - `repo`: the `.gitignore` at the worktree root.
 */
export type IgnoreSource = 'global' | 'local' | 'repo';

/** An ignore file git would consult. It may not exist. */
export interface IgnoreFileLocation {
  source: IgnoreSource;
  /** Absolute path. */
  path: string;
}

/**
 * Finds every ignore file git would consult for `cwd`, whether or not it
 * exists. Repo-specific files are left out when `cwd` isn't inside a git
 * worktree.
 *
 * Results are ordered from lowest to highest precedence (`global`,
 * `local`, `repo`), matching git: later rules override earlier ones.
 */
export const discoverIgnoreFiles = async (
  cwd: string,
): Promise<IgnoreFileLocation[]> => {
  const [globalPath, repoPaths] = await Promise.all([
    findGlobalIgnoreFile(cwd),
    findRepoIgnoreFiles(cwd),
  ]);

  return [{ source: 'global', path: globalPath }, ...repoPaths];
};

const findGlobalIgnoreFile = async (cwd: string): Promise<string> => {
  // `--path` expands `~` the way git itself would. Exits non-zero when
  // the key is unset.
  const configured = await git(
    cwd,
    'config',
    '--path',
    '--get',
    'core.excludesFile',
  ).catch(() => null);

  if (configured) return resolve(cwd, configured);

  const configHome = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
  return join(configHome, 'git', 'ignore');
};

const findRepoIgnoreFiles = async (
  cwd: string,
): Promise<IgnoreFileLocation[]> => {
  // Asking git (rather than walking up for `.git`) resolves worktrees,
  // where `info/exclude` lives in the main clone's git dir. Fails outside
  // a worktree.
  const output = await git(
    cwd,
    'rev-parse',
    '--path-format=absolute',
    '--show-toplevel',
    '--git-path',
    'info/exclude',
  ).catch(() => null);

  const [toplevel, localExclude] = output?.split('\n') ?? [];
  if (!toplevel || !localExclude) return [];

  return [
    { source: 'local', path: localExclude },
    { source: 'repo', path: join(toplevel, '.gitignore') },
  ];
};
