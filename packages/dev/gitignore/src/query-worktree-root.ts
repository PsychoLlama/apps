import { git } from './git.ts';

/**
 * The root of the git worktree containing `cwd`, or `null` outside one.
 * Ignore rules match paths relative to this directory.
 */
export const queryWorktreeRoot = (cwd: string): Promise<string | null> =>
  git(cwd, 'rev-parse', '--show-toplevel').catch(() => null);
