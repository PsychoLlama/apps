import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { instrumentationScope } from '../vite-plugin/instrumentation-scope.ts';

// Assemble the marker at runtime so this source file itself doesn't
// contain the literal token. The Vite plugin we're testing rewrites
// any module that matches it — including this one when vitest loads
// it — which would mangle fixture strings before the assertions run.
const MARKER = ['import', 'meta', 'INSTRUMENTATION_SCOPE'].join('.');

const fakeContext = {
  error: (message: string) => {
    throw new Error(message);
  },
};

const callTransform = (
  plugin: Plugin,
  code: string,
  id: string,
): Promise<{ code: string; map: null } | undefined> => {
  const hook = plugin.transform as
    | ((this: typeof fakeContext, code: string, id: string) => Promise<unknown>)
    | {
        handler: (
          this: typeof fakeContext,
          code: string,
          id: string,
        ) => Promise<unknown>;
      };
  const fn = typeof hook === 'function' ? hook : hook.handler;
  return fn.call(fakeContext, code, id) as Promise<
    { code: string; map: null } | undefined
  >;
};

describe('instrumentationScope', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkdtemp(join(tmpdir(), 'instrumentation-scope-'));
  });

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  const seedPackage = async (
    relPath: string,
    name: string,
  ): Promise<{ srcDir: string }> => {
    const pkgDir = join(tmp, relPath);
    const srcDir = join(pkgDir, 'src');
    await mkdir(srcDir, { recursive: true });
    await writeFile(
      join(pkgDir, 'package.json'),
      JSON.stringify({ name, private: true }),
    );
    return { srcDir };
  };

  it('skips modules that do not reference the marker', async () => {
    const { srcDir } = await seedPackage('pkg', '@scope/pkg');
    const file = join(srcDir, 'index.ts');
    await writeFile(file, 'export const x = 1;');

    const result = await callTransform(
      instrumentationScope(),
      'export const x = 1;',
      file,
    );

    expect(result).toBeUndefined();
  });

  it('injects [pkgName, ...segments] for a top-level file', async () => {
    const { srcDir } = await seedPackage('pkg', '@scope/pkg');
    const file = join(srcDir, 'entry-client.tsx');
    await writeFile(file, 'export {};');

    const result = await callTransform(
      instrumentationScope(),
      `const s = ${MARKER};`,
      file,
    );

    expect(result?.code).toBe('const s = ["@scope/pkg","entry-client"];');
  });

  it('emits one segment per directory under src/', async () => {
    const { srcDir } = await seedPackage('pkg', '@scope/pkg');
    const file = join(srcDir, 'routes', 'about', 'index.tsx');
    await mkdir(join(srcDir, 'routes', 'about'), { recursive: true });
    await writeFile(file, 'export {};');

    const result = await callTransform(
      instrumentationScope(),
      `log(${MARKER});`,
      file,
    );

    expect(result?.code).toBe('log(["@scope/pkg","routes","about","index"]);');
  });

  it('strips only the final extension (preserves dotted basenames)', async () => {
    const { srcDir } = await seedPackage('pkg', '@scope/pkg');
    const file = join(srcDir, '__tests__', 'foo.test.ts');
    await mkdir(join(srcDir, '__tests__'), { recursive: true });
    await writeFile(file, 'export {};');

    const result = await callTransform(
      instrumentationScope(),
      `x(${MARKER});`,
      file,
    );

    expect(result?.code).toBe('x(["@scope/pkg","__tests__","foo.test"]);');
  });

  it('strips query and hash from the id before resolving', async () => {
    const { srcDir } = await seedPackage('pkg', '@scope/pkg');
    const file = join(srcDir, 'entry-client.tsx');
    await writeFile(file, 'export {};');

    const result = await callTransform(
      instrumentationScope(),
      `x(${MARKER});`,
      `${file}?worker&url`,
    );

    expect(result?.code).toBe('x(["@scope/pkg","entry-client"]);');
  });

  it('skips virtual modules (id starting with \\0)', async () => {
    const result = await callTransform(
      instrumentationScope(),
      `x(${MARKER});`,
      '\0virtual:something',
    );

    expect(result).toBeUndefined();
  });

  it('errors when the marker appears outside any package', async () => {
    await expect(
      callTransform(
        instrumentationScope(),
        `x(${MARKER});`,
        join(tmp, 'orphan.ts'),
      ),
    ).rejects.toThrow(/no package\.json/);
  });

  it('errors when the file is not under the package src/ directory', async () => {
    const pkgDir = join(tmp, 'pkg');
    await mkdir(pkgDir, { recursive: true });
    await writeFile(
      join(pkgDir, 'package.json'),
      JSON.stringify({ name: '@scope/pkg' }),
    );
    const file = join(pkgDir, 'vite.config.ts');
    await writeFile(file, 'export default {};');

    await expect(
      callTransform(instrumentationScope(), `x(${MARKER});`, file),
    ).rejects.toThrow(/not under/);
  });

  it('replaces every occurrence in a single module', async () => {
    const { srcDir } = await seedPackage('pkg', '@scope/pkg');
    const file = join(srcDir, 'index.ts');
    await writeFile(file, 'export {};');

    const result = await callTransform(
      instrumentationScope(),
      `a(${MARKER}); b(${MARKER});`,
      file,
    );

    expect(result?.code).toBe(
      'a(["@scope/pkg","index"]); b(["@scope/pkg","index"]);',
    );
  });
});
