/**
 * `check catalog` subcommand. Fails when a workspace package
 * references a catalog'd dependency with a literal version range
 * instead of `catalog:` — that path silently bypasses the catalog
 * and lets versions drift.
 *
 * pnpm's `catalogMode: strict` only fires on `pnpm add`, not on
 * edits to existing manifests (see
 * https://github.com/pnpm/pnpm/issues/8644), so we run our own
 * check.
 *
 * The pure validator and its types are exported alongside the
 * command so tests can drive it with synthetic data — no
 * filesystem, no shellouts, no YAML reader.
 */

/* eslint-disable no-console -- stdout/stderr are this CLI's output surface. */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { defineCommand } from 'citty';
import { readWorkspaceManifest } from '@pnpm/workspace.read-manifest';
import { x } from 'tinyexec';

/** Catalog name → (depName → version range), shaped to match `@pnpm/workspace.read-manifest`. */
export interface Catalogs {
  /** The unnamed default catalog; referenced by `catalog:` or `catalog:default`. */
  default?: Record<string, string>;
  /** Named catalogs; referenced by `catalog:<name>`. */
  named?: Record<string, Record<string, string>>;
}

/** A single workspace package's manifest, narrowed to the dep buckets we check. */
export interface PackageManifest {
  name: string;
  /** Workspace-relative path to the manifest, used for the issue report. */
  path: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

/** A single non-catalog dep finding surfaced to the user. */
export interface Issue {
  /** Package name (from manifest), used in the report. */
  pkg: string;
  /** Workspace-relative path to the offending manifest. */
  path: string;
  /** Which dep bucket the violation is in. */
  bucket: 'dependencies' | 'devDependencies' | 'optionalDependencies';
  /** Dep name. */
  name: string;
  /** The current (non-`catalog:`) version range. */
  actual: string;
  /** Catalog name the dep belongs to (`'default'` or a named catalog). */
  catalog: string;
  /** The `catalog:` reference the package should use instead. */
  expected: string;
}

const DEP_BUCKETS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
] as const;

/**
 * Index every catalog'd dep to the catalog it lives in. Default
 * wins on collision — matches pnpm's resolution order for the bare
 * `catalog:` shorthand.
 */
const indexCatalogs = (catalogs: Catalogs): Map<string, string> => {
  const index = new Map<string, string>();

  for (const [name, entries] of Object.entries(catalogs.named ?? {})) {
    for (const dep of Object.keys(entries)) {
      index.set(dep, name);
    }
  }

  for (const dep of Object.keys(catalogs.default ?? {})) {
    index.set(dep, 'default');
  }

  return index;
};

/**
 * Pure validator. `peerDependencies` are intentionally excluded:
 * the convention in this monorepo (see AGENTS.md) is to declare
 * runtime singletons like `solid-js` as peers with a `"*"` range
 * so the host supplies the actual version via `catalog:`. Flagging
 * those would be a stream of false positives.
 */
export const checkCatalogUsage = (
  catalogs: Catalogs,
  packages: PackageManifest[],
): Issue[] => {
  const catalogIndex = indexCatalogs(catalogs);
  if (catalogIndex.size === 0) return [];

  const issues: Issue[] = [];

  for (const pkg of packages) {
    for (const bucket of DEP_BUCKETS) {
      for (const [name, actual] of Object.entries(pkg[bucket] ?? {})) {
        if (actual.startsWith('catalog:')) continue;

        const catalog = catalogIndex.get(name);
        if (catalog === undefined) continue;

        issues.push({
          pkg: pkg.name,
          path: pkg.path,
          bucket,
          name,
          actual,
          catalog,
          expected: catalog === 'default' ? 'catalog:' : `catalog:${catalog}`,
        });
      }
    }
  }

  return issues;
};

interface PnpmListEntry {
  name: string;
  path: string;
  private?: boolean;
}

const listPackages = async (
  workspaceRoot: string,
): Promise<PnpmListEntry[]> => {
  const { stdout } = await x('pnpm', ['-r', 'list', '--depth', '0', '--json'], {
    nodeOptions: { cwd: workspaceRoot },
    throwOnError: true,
  });
  return JSON.parse(stdout) as PnpmListEntry[];
};

const loadManifest = async (
  workspaceRoot: string,
  entry: PnpmListEntry,
): Promise<PackageManifest> => {
  const manifestPath = path.join(entry.path, 'package.json');
  const raw = await readFile(manifestPath, 'utf8');
  const parsed = JSON.parse(raw) as Omit<PackageManifest, 'path'>;
  return {
    ...parsed,
    path: path.relative(workspaceRoot, manifestPath) || 'package.json',
  };
};

const printReport = (issues: Issue[]): void => {
  console.error(
    `Found ${issues.length} non-catalog dependency reference(s):\n`,
  );
  for (const { path, bucket, name, actual, expected } of issues) {
    console.error(`  ${path}  [${bucket}]  ${name}: ${actual}  →  ${expected}`);
  }
  console.error(
    '\nFix: replace the version range with the listed `catalog:` reference, ' +
      "or remove the entry from `pnpm-workspace.yaml`'s catalog if the package " +
      'genuinely needs to drift.',
  );
};

export default defineCommand({
  meta: {
    name: 'catalog',
    description:
      "Check that every workspace package references catalog'd dependencies via `catalog:` instead of a literal version.",
  },
  async run() {
    const workspaceRoot = process.cwd();
    const manifest = await readWorkspaceManifest(workspaceRoot);

    if (manifest === undefined) {
      console.error(
        'No pnpm-workspace.yaml found at the current working directory.',
      );
      process.exitCode = 1;
      return;
    }

    const catalogs: Catalogs = {
      default: manifest.catalog,
      named: manifest.catalogs,
    };

    const entries = (await listPackages(workspaceRoot)).filter(
      // The repo root itself is included in `pnpm -r list`; skip it
      // since its `package.json` only carries dev tooling that lives
      // outside the catalog enforcement contract.
      ({ path: pkgPath }) => pkgPath !== workspaceRoot,
    );

    const packages = await Promise.all(
      entries.map((entry) => loadManifest(workspaceRoot, entry)),
    );

    const issues = checkCatalogUsage(catalogs, packages);

    if (issues.length === 0) {
      console.log("All catalog'd dependencies use the `catalog:` protocol.");
      return;
    }

    printReport(issues);
    process.exitCode = 1;
  },
});
