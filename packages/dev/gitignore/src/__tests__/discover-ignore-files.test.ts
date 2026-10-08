import { mkdir, mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { discoverIgnoreFiles } from '../discover-ignore-files.ts';
import { git } from '../git.ts';

describe('discoverIgnoreFiles', () => {
  /**
   * A fresh git repo under a throwaway `$HOME`, isolated from the
   * developer's real git config. Disposing restores the environment and
   * deletes everything.
   */
  const createSandbox = async () => {
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

      [Symbol.asyncDispose]: async () => {
        vi.unstubAllEnvs();
        await rm(root, { recursive: true, force: true });
      },
    };
  };

  it('finds every source, lowest precedence first', async () => {
    await using sandbox = await createSandbox();

    await expect(discoverIgnoreFiles(sandbox.repo)).resolves.toEqual([
      { source: 'global', path: join(sandbox.home, '.config/git/ignore') },
      { source: 'local', path: join(sandbox.repo, '.git/info/exclude') },
      { source: 'repo', path: join(sandbox.repo, '.gitignore') },
    ]);
  });

  it('finds the repo root from a subdirectory', async () => {
    await using sandbox = await createSandbox();
    await mkdir(join(sandbox.repo, 'packages'));

    const files = await discoverIgnoreFiles(join(sandbox.repo, 'packages'));

    expect(files).toContainEqual({
      source: 'repo',
      path: join(sandbox.repo, '.gitignore'),
    });
  });

  it('honors a configured `core.excludesFile`', async () => {
    await using sandbox = await createSandbox();
    await git(
      sandbox.repo,
      'config',
      '--global',
      'core.excludesFile',
      '~/custom-ignore',
    );

    const files = await discoverIgnoreFiles(sandbox.repo);

    expect(files).toContainEqual({
      source: 'global',
      path: join(sandbox.home, 'custom-ignore'),
    });
  });

  it('finds only the global file outside a repo', async () => {
    await using sandbox = await createSandbox();
    const outside = join(sandbox.root, 'outside');
    await mkdir(outside);

    await expect(discoverIgnoreFiles(outside)).resolves.toEqual([
      { source: 'global', path: join(sandbox.home, '.config/git/ignore') },
    ]);
  });

  it("finds a worktree's own `.gitignore` and the clone's excludes", async () => {
    await using sandbox = await createSandbox();
    await git(
      sandbox.repo,
      '-c',
      'user.name=test',
      '-c',
      'user.email=test@example.com',
      'commit',
      '--quiet',
      '--allow-empty',
      '-m',
      'init',
    );

    const worktree = join(sandbox.root, 'worktree');
    await git(sandbox.repo, 'worktree', 'add', '--quiet', worktree);

    const files = await discoverIgnoreFiles(worktree);

    expect(files).toContainEqual({
      source: 'local',
      path: join(sandbox.repo, '.git/info/exclude'),
    });
    expect(files).toContainEqual({
      source: 'repo',
      path: join(worktree, '.gitignore'),
    });
  });
});
