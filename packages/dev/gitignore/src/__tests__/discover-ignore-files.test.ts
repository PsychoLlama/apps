import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { discoverIgnoreFiles } from '../discover-ignore-files.ts';
import { git } from '../git.ts';
import { createGitSandbox } from './git-sandbox.ts';

describe('discoverIgnoreFiles', () => {
  it('finds every source, lowest precedence first', async () => {
    await using sandbox = await createGitSandbox();

    await expect(discoverIgnoreFiles(sandbox.repo)).resolves.toEqual([
      { source: 'global', path: sandbox.globalIgnorePath },
      { source: 'local', path: join(sandbox.repo, '.git/info/exclude') },
      { source: 'repo', path: join(sandbox.repo, '.gitignore') },
    ]);
  });

  it('finds the repo root from a subdirectory', async () => {
    await using sandbox = await createGitSandbox();
    await mkdir(join(sandbox.repo, 'packages'));

    const files = await discoverIgnoreFiles(join(sandbox.repo, 'packages'));

    expect(files).toContainEqual({
      source: 'repo',
      path: join(sandbox.repo, '.gitignore'),
    });
  });

  it('honors a configured `core.excludesFile`', async () => {
    await using sandbox = await createGitSandbox();
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
    await using sandbox = await createGitSandbox();
    const outside = join(sandbox.root, 'outside');
    await mkdir(outside);

    await expect(discoverIgnoreFiles(outside)).resolves.toEqual([
      { source: 'global', path: sandbox.globalIgnorePath },
    ]);
  });

  it("finds a worktree's own `.gitignore` and the clone's excludes", async () => {
    await using sandbox = await createGitSandbox();
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
