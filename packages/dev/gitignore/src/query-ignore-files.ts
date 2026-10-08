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
export type IgnoreScope = 'global' | 'local' | 'repo';

/** An ignore file git would consult. It may not exist. */
export interface IgnoreFile {
  scope: IgnoreScope;
  /** Absolute path. */
  path: string;
}

/**
 * Queries every ignore file git would consult for `cwd`, whether or not it
 * exists. Repo-specific files are left out when `cwd` isn't inside a git
 * worktree.
 *
 * Results are ordered from lowest to highest precedence (`global`,
 * `local`, `repo`), matching git: later rules override earlier ones.
 */
export const queryIgnoreFiles = async (cwd: string): Promise<IgnoreFile[]> => {
  // Queries run in parallel; the order below is fixed regardless of which
  // finishes first.
  const [globalPath, repoPaths] = await Promise.all([
    queryGlobalIgnoreFile(cwd),
    queryRepoIgnoreFiles(cwd),
  ]);

  return [{ scope: 'global', path: globalPath }, ...repoPaths];
};

const queryGlobalIgnoreFile = async (cwd: string): Promise<string> => {
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

const queryRepoIgnoreFiles = async (cwd: string): Promise<IgnoreFile[]> => {
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
    { scope: 'local', path: localExclude },
    { scope: 'repo', path: join(toplevel, '.gitignore') },
  ];
};
