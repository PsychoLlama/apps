import { mkdir, mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { git } from '../git.ts';

/**
 * A fresh git repo under a throwaway `$HOME`, isolated from the
 * developer's real git config. Disposing restores the environment and
 * deletes everything.
 */
export const createGitSandbox = async () => {
  // Resolved so paths compare equal to what git reports.
  const root = await realpath(await mkdtemp(join(tmpdir(), 'gitignore-')));
  const home = join(root, 'home');
  const repo = join(root, 'repo');
  await mkdir(home);
  await mkdir(repo);

  vi.stubEnv('HOME', home);
  vi.stubEnv('XDG_CONFIG_HOME', join(home, '.config'));
  vi.stubEnv('GIT_CONFIG_GLOBAL', join(home, '.gitconfig'));
  vi.stubEnv('GIT_CONFIG_NOSYSTEM', '1');

  await git(repo, 'init', '--quiet');

  return {
    root,
    home,
    repo,

    /** Git's default global excludes file. */
    globalIgnorePath: join(home, '.config/git/ignore'),

    [Symbol.asyncDispose]: async () => {
      vi.unstubAllEnvs();
      await rm(root, { recursive: true, force: true });
    },
  };
};
