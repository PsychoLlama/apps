import {
  checkMoonInputs,
  resolveToWorkspace,
  type FsProbes,
  type ProjectSources,
  type TaskIndex,
} from '../moon-input-check.ts';

const alwaysExists: FsProbes = {
  exists: () => true,
  globMatches: () => ['match'],
};

const noneExist: FsProbes = {
  exists: () => false,
  globMatches: () => [],
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
  it('returns no issues when every input resolves', () => {
    const tasks: TaskIndex = {
      '@app/main': {
        build: {
          inputs: [{ file: 'vite.config.ts' }, { glob: 'src/**/*' }],
        },
      },
    };

    expect(checkMoonInputs(sources, tasks, alwaysExists)).toEqual([]);
  });

  it('flags a literal input whose file is missing', () => {
    const tasks: TaskIndex = {
      '@app/main': {
        build: { inputs: [{ file: 'wrangler.toml' }] },
      },
    };

    expect(checkMoonInputs(sources, tasks, noneExist)).toEqual([
      {
        target: '@app/main:build',
        kind: 'missing file',
        value: 'wrangler.toml',
      },
    ]);
  });

  it('flags a glob that matches nothing', () => {
    const tasks: TaskIndex = {
      '@app/main': {
        build: { inputs: [{ glob: 'src/**/*' }] },
      },
    };

    expect(checkMoonInputs(sources, tasks, noneExist)).toEqual([
      {
        target: '@app/main:build',
        kind: 'empty glob',
        value: 'src/**/*',
      },
    ]);
  });

  it('skips entries marked optional', () => {
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

    expect(checkMoonInputs(sources, tasks, noneExist)).toEqual([]);
  });

  it('resolves workspace-rooted paths against the workspace root', () => {
    const captured: string[] = [];
    const tasks: TaskIndex = {
      '@app/main': {
        build: { inputs: [{ file: '/pnpm-lock.yaml' }] },
      },
    };

    checkMoonInputs(sources, tasks, {
      exists: (rel) => {
        captured.push(rel);
        return true;
      },
      globMatches: () => [],
    });

    expect(captured).toEqual(['pnpm-lock.yaml']);
  });

  it('resolves project-relative paths against the project source', () => {
    const captured: string[] = [];
    const tasks: TaskIndex = {
      '@app/main': {
        build: { inputs: [{ glob: 'src/**/*' }] },
      },
    };

    checkMoonInputs(sources, tasks, {
      exists: () => true,
      globMatches: (pattern) => {
        captured.push(pattern);
        return ['match'];
      },
    });

    expect(captured).toEqual(['packages/app/main/src/**/*']);
  });

  it('skips tasks from unknown projects rather than crashing', () => {
    const tasks: TaskIndex = {
      '@ghost/pkg': {
        build: { inputs: [{ file: 'missing.ts' }] },
      },
    };

    expect(checkMoonInputs(sources, tasks, noneExist)).toEqual([]);
  });
});
