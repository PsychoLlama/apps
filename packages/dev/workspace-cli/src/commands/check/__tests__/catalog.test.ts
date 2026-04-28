import {
  checkCatalogUsage,
  type Catalogs,
  type PackageManifest,
} from '../catalog.ts';

const noCatalogs: Catalogs = {};

describe('checkCatalogUsage', () => {
  it('returns no issues when the workspace has no catalog', () => {
    const packages: PackageManifest[] = [
      {
        name: '@app/main',
        path: 'packages/app/main/package.json',
        dependencies: { 'solid-js': '^1.9.5' },
      },
    ];

    expect(checkCatalogUsage(noCatalogs, packages)).toEqual([]);
  });

  it("flags a catalog'd dep that uses a literal version range", () => {
    const catalogs: Catalogs = {
      default: { 'solid-js': '^1.9.5' },
    };
    const packages: PackageManifest[] = [
      {
        name: '@app/main',
        path: 'packages/app/main/package.json',
        dependencies: { 'solid-js': '^1.9.5' },
      },
    ];

    expect(checkCatalogUsage(catalogs, packages)).toEqual([
      {
        pkg: '@app/main',
        path: 'packages/app/main/package.json',
        bucket: 'dependencies',
        name: 'solid-js',
        actual: '^1.9.5',
        catalog: 'default',
        expected: 'catalog:',
      },
    ]);
  });

  it("accepts a catalog'd dep that uses the `catalog:` shorthand", () => {
    const catalogs: Catalogs = {
      default: { 'solid-js': '^1.9.5' },
    };
    const packages: PackageManifest[] = [
      {
        name: '@app/main',
        path: 'packages/app/main/package.json',
        dependencies: { 'solid-js': 'catalog:' },
      },
    ];

    expect(checkCatalogUsage(catalogs, packages)).toEqual([]);
  });

  it("accepts a catalog'd dep that uses the explicit `catalog:default`", () => {
    const catalogs: Catalogs = {
      default: { 'solid-js': '^1.9.5' },
    };
    const packages: PackageManifest[] = [
      {
        name: '@app/main',
        path: 'packages/app/main/package.json',
        dependencies: { 'solid-js': 'catalog:default' },
      },
    ];

    expect(checkCatalogUsage(catalogs, packages)).toEqual([]);
  });

  it('checks devDependencies and optionalDependencies too', () => {
    const catalogs: Catalogs = {
      default: { vitest: '^4.1.5', idb: '^8.0.3' },
    };
    const packages: PackageManifest[] = [
      {
        name: '@lib/x',
        path: 'packages/lib/x/package.json',
        devDependencies: { vitest: '^4.0.0' },
        optionalDependencies: { idb: '^7.0.0' },
      },
    ];

    expect(
      checkCatalogUsage(catalogs, packages).map((issue) => issue.bucket),
    ).toEqual(['devDependencies', 'optionalDependencies']);
  });

  it('skips peerDependencies — runtime singletons use `*` by convention', () => {
    const catalogs: Catalogs = {
      default: { 'solid-js': '^1.9.5' },
    };
    const packages: PackageManifest[] = [
      {
        name: '@lib/ui',
        path: 'packages/lib/ui/package.json',
        // peerDependencies is intentionally absent from the
        // PackageManifest type, so a literal cast keeps this honest:
        // the field exists in real package.json files but the
        // checker shouldn't read it.
        ...({ peerDependencies: { 'solid-js': '*' } } as object),
      },
    ];

    expect(checkCatalogUsage(catalogs, packages)).toEqual([]);
  });

  it("ignores deps that aren't in any catalog", () => {
    const catalogs: Catalogs = {
      default: { 'solid-js': '^1.9.5' },
    };
    const packages: PackageManifest[] = [
      {
        name: '@app/main',
        path: 'packages/app/main/package.json',
        dependencies: {
          'solid-js': 'catalog:',
          '@solidjs/start': '2.0.0-alpha.2',
        },
      },
    ];

    expect(checkCatalogUsage(catalogs, packages)).toEqual([]);
  });

  it('routes named-catalog deps to `catalog:<name>`', () => {
    const catalogs: Catalogs = {
      named: {
        react18: { react: '^18.0.0' },
      },
    };
    const packages: PackageManifest[] = [
      {
        name: '@app/legacy',
        path: 'packages/app/legacy/package.json',
        dependencies: { react: '^18.2.0' },
      },
    ];

    expect(checkCatalogUsage(catalogs, packages)).toEqual([
      {
        pkg: '@app/legacy',
        path: 'packages/app/legacy/package.json',
        bucket: 'dependencies',
        name: 'react',
        actual: '^18.2.0',
        catalog: 'react18',
        expected: 'catalog:react18',
      },
    ]);
  });

  it('prefers the default catalog over a named catalog on collision', () => {
    // Mirrors pnpm's resolution: the bare `catalog:` shorthand
    // points at default, so default wins when a dep appears in both.
    const catalogs: Catalogs = {
      default: { react: '^19.0.0' },
      named: { legacy: { react: '^18.0.0' } },
    };
    const packages: PackageManifest[] = [
      {
        name: '@app/main',
        path: 'packages/app/main/package.json',
        dependencies: { react: '^19.0.0' },
      },
    ];

    expect(checkCatalogUsage(catalogs, packages)).toEqual([
      expect.objectContaining({
        catalog: 'default',
        expected: 'catalog:',
      }),
    ]);
  });
});
