import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { loadGitignore } from '../load-gitignore.ts';
import { createGitSandbox } from './git-sandbox.ts';

describe('loadGitignore', () => {
  const writeGlobalIgnore = async (path: string, contents: string) => {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, contents);
  };

  it('combines rules from every source', async () => {
    await using sandbox = await createGitSandbox();
    await writeGlobalIgnore(sandbox.globalIgnorePath, '.direnv/\n');
    await writeFile(join(sandbox.repo, '.git/info/exclude'), 'scratch/\n');
    await writeFile(join(sandbox.repo, '.gitignore'), '# build\ndist\n');

    const ig = await loadGitignore(sandbox.repo);

    expect(ig.ignores('.direnv/')).toBe(true);
    expect(ig.ignores('scratch/notes.md')).toBe(true);
    expect(ig.ignores('packages/foo/dist/index.js')).toBe(true);
    expect(ig.ignores('packages/foo/src/index.ts')).toBe(false);
  });

  it('lets higher-precedence sources negate lower ones', async () => {
    await using sandbox = await createGitSandbox();
    await writeGlobalIgnore(sandbox.globalIgnorePath, '*.log\n');
    await writeFile(join(sandbox.repo, '.gitignore'), '!keep.log\n');

    const ig = await loadGitignore(sandbox.repo);

    expect(ig.ignores('debug.log')).toBe(true);
    expect(ig.ignores('keep.log')).toBe(false);
  });

  it('ignores nothing when no files exist', async () => {
    await using sandbox = await createGitSandbox();

    const ig = await loadGitignore(sandbox.repo);

    expect(ig.ignores('anything.txt')).toBe(false);
  });
});
