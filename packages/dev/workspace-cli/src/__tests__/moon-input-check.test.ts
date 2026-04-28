import {
  checkMoonInputs,
  resolveToWorkspace,
  type FsProbes,
  type ProjectSources,
  type TaskIndex,
} from '../moon-input-check.ts';

const alwaysExists: FsProbes = {
  exists: () => Promise.resolve(true),
  globMatches: () => Promise.resolve(['match']),
};

const noneExist: FsProbes = {
  exists: () => Promise.resolve(false),
  globMatches: () => Promise.resolve([]),
};

const sources: ProjectSources = {
  root: '.',
  '@app/main': 'packages/app/main',
};

describe('resolveToWorkspace', () => {
  it('strips the leading slash on workspace-rooted paths', () => {
    expect(resolveToWorkspace('packages/app/main', '/pnpm-lock.yaml')).toBe(
      'pnpm-lock.yaml',
    );
  });

  it('prepends the project source on project-relative paths', () => {
    expect(resolveToWorkspace('packages/app/main', 'src/app.tsx')).toBe(
      'packages/app/main/src/app.tsx',
    );
  });

  it("leaves project-relative paths alone when the source is '.'", () => {
    expect(resolveToWorkspace('.', 'eslint.config.ts')).toBe(
      'eslint.config.ts',
    );
  });
});

describe('checkMoonInputs', () => {
  it('returns no issues when every input resolves', async () => {
    const tasks: TaskIndex = {
      '@app/main': {
        build: {
          inputs: [{ file: 'vite.config.ts' }, { glob: 'src/**/*' }],
        },
      },
    };

    await expect(
      checkMoonInputs(sources, tasks, alwaysExists),
    ).resolves.toEqual([]);
  });

  it('flags a literal input whose file is missing', async () => {
    const tasks: TaskIndex = {
      '@app/main': {
        build: { inputs: [{ file: 'wrangler.toml' }] },
      },
    };

    await expect(checkMoonInputs(sources, tasks, noneExist)).resolves.toEqual([
      {
        target: '@app/main:build',
        kind: 'missing file',
        value: 'wrangler.toml',
      },
    ]);
  });

  it('flags a glob that matches nothing', async () => {
    const tasks: TaskIndex = {
      '@app/main': {
        build: { inputs: [{ glob: 'src/**/*' }] },
      },
    };

    await expect(checkMoonInputs(sources, tasks, noneExist)).resolves.toEqual([
      {
        target: '@app/main:build',
        kind: 'empty glob',
        value: 'src/**/*',
      },
    ]);
  });

  it('skips negative-glob entries (they subtract from other matches)', async () => {
    const tasks: TaskIndex = {
      '@app/main': {
        build: {
          inputs: [{ glob: 'src/**/*' }, { glob: '!src/**/*.test.tsx' }],
        },
      },
    };

    await expect(checkMoonInputs(sources, tasks, noneExist)).resolves.toEqual([
      { target: '@app/main:build', kind: 'empty glob', value: 'src/**/*' },
    ]);
  });

  it('skips entries marked optional', async () => {
    const tasks: TaskIndex = {
      '@app/main': {
        build: {
          inputs: [
            { file: 'vite.config.ts', optional: true },
            { glob: 'src/**/*', optional: true },
          ],
        },
      },
    };

    await expect(checkMoonInputs(sources, tasks, noneExist)).resolves.toEqual(
      [],
    );
  });

  it('resolves workspace-rooted paths against the workspace root', async () => {
    const captured: string[] = [];
    const tasks: TaskIndex = {
      '@app/main': {
        build: { inputs: [{ file: '/pnpm-lock.yaml' }] },
      },
    };

    await checkMoonInputs(sources, tasks, {
      exists: (rel) => {
        captured.push(rel);
        return Promise.resolve(true);
      },
      globMatches: () => Promise.resolve([]),
    });

    expect(captured).toEqual(['pnpm-lock.yaml']);
  });

  it('resolves project-relative paths against the project source', async () => {
    const captured: string[] = [];
    const tasks: TaskIndex = {
      '@app/main': {
        build: { inputs: [{ glob: 'src/**/*' }] },
      },
    };

    await checkMoonInputs(sources, tasks, {
      exists: () => Promise.resolve(true),
      globMatches: (pattern) => {
        captured.push(pattern);
        return Promise.resolve(['match']);
      },
    });

    expect(captured).toEqual(['packages/app/main/src/**/*']);
  });

  it('skips tasks from unknown projects rather than crashing', async () => {
    const tasks: TaskIndex = {
      '@ghost/pkg': {
        build: { inputs: [{ file: 'missing.ts' }] },
      },
    };

    await expect(checkMoonInputs(sources, tasks, noneExist)).resolves.toEqual(
      [],
    );
  });
});
