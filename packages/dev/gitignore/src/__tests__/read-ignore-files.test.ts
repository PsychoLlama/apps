import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { readIgnoreFiles } from '../read-ignore-files.ts';

describe('readIgnoreFiles', () => {
  /** A throwaway directory, deleted on dispose. */
  const createSandbox = async () => {
    const root = await mkdtemp(join(tmpdir(), 'gitignore-'));

    return {
      root,
      [Symbol.asyncDispose]: () => rm(root, { recursive: true, force: true }),
    };
  };

  it('reads each file, keeping input order', async () => {
    await using sandbox = await createSandbox();
    const global = { scope: 'global' as const, path: join(sandbox.root, 'g') };
    const repo = { scope: 'repo' as const, path: join(sandbox.root, 'r') };
    await writeFile(global.path, '.direnv/\n');
    await writeFile(repo.path, 'dist\n');

    await expect(readIgnoreFiles([global, repo])).resolves.toEqual([
      { ...global, contents: '.direnv/\n' },
      { ...repo, contents: 'dist\n' },
    ]);
  });

  it('skips files that cannot be read', async () => {
    await using sandbox = await createSandbox();
    const repo = { scope: 'repo' as const, path: join(sandbox.root, 'r') };
    await writeFile(repo.path, 'dist\n');

    const files = await readIgnoreFiles([
      { scope: 'global', path: join(sandbox.root, 'missing') },
      // A directory: exists, but can't be read as a file.
      { scope: 'local', path: sandbox.root },
      repo,
    ]);

    expect(files).toEqual([{ ...repo, contents: 'dist\n' }]);
  });
});
