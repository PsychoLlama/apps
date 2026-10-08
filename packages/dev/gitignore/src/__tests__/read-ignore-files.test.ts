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
    await writeFile(join(sandbox.root, 'global'), '.direnv/\n');
    await writeFile(join(sandbox.root, 'repo'), 'dist\n');

    const files = await readIgnoreFiles([
      { source: 'global', path: join(sandbox.root, 'global') },
      { source: 'repo', path: join(sandbox.root, 'repo') },
    ]);

    expect(files).toEqual([
      { source: 'global', fileContents: '.direnv/\n' },
      { source: 'repo', fileContents: 'dist\n' },
    ]);
  });

  it('skips files that cannot be read', async () => {
    await using sandbox = await createSandbox();
    await writeFile(join(sandbox.root, 'repo'), 'dist\n');

    const files = await readIgnoreFiles([
      { source: 'global', path: join(sandbox.root, 'missing') },
      // A directory: exists, but can't be read as a file.
      { source: 'local', path: sandbox.root },
      { source: 'repo', path: join(sandbox.root, 'repo') },
    ]);

    expect(files).toEqual([{ source: 'repo', fileContents: 'dist\n' }]);
  });
});
