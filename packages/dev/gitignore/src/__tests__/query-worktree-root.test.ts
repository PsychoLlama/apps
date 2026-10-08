import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { queryWorktreeRoot } from '../query-worktree-root.ts';
import { createGitSandbox } from './git-sandbox.ts';

describe('queryWorktreeRoot', () => {
  it('finds the root from a subdirectory', async () => {
    await using sandbox = await createGitSandbox();
    await mkdir(join(sandbox.repo, 'packages'));

    await expect(
      queryWorktreeRoot(join(sandbox.repo, 'packages')),
    ).resolves.toBe(sandbox.repo);
  });

  it('returns null outside a repo', async () => {
    await using sandbox = await createGitSandbox();

    await expect(queryWorktreeRoot(sandbox.home)).resolves.toBeNull();
  });
});
