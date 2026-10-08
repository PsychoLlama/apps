/**
 * `check package-manager` subcommand. Fails when the root
 * `packageManager` field doesn't pin the exact pnpm version the flake
 * provides.
 *
 * pnpm (and Renovate, which honors the field) installs whatever
 * version `packageManager` names, so drift from the flake means
 * lockfiles get written by a pnpm that CI doesn't run. The flake
 * exports its version as `NIX_PNPM_VERSION`; we can't ask `pnpm
 * --version` because pnpm itself switches to the pinned version.
 *
 * The pure validator is exported alongside the command so tests can
 * drive it without touching the filesystem or environment.
 */

/* eslint-disable no-console -- stdout/stderr are this CLI's output surface. */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { defineCommand } from 'citty';

/** A reason the `packageManager` field doesn't match the flake. */
export type Issue =
  | { kind: 'missing-flake-version' }
  | { kind: 'missing-field' }
  | { kind: 'wrong-manager'; actual: string }
  | { kind: 'version-mismatch'; actual: string; expected: string };

/**
 * Pure validator. `packageManager` is the raw field value (e.g.
 * `pnpm@12.3.4`, optionally with a `+sha512.…` integrity suffix);
 * `flakeVersion` is the flake's pnpm version.
 */
export const checkPackageManager = (
  packageManager: string | undefined,
  flakeVersion: string | undefined,
): Issue | null => {
  if (!flakeVersion) return { kind: 'missing-flake-version' };
  if (!packageManager) return { kind: 'missing-field' };

  const [name, versionWithHash = ''] = packageManager.split('@');
  if (name !== 'pnpm') return { kind: 'wrong-manager', actual: packageManager };

  const [version] = versionWithHash.split('+');
  if (version !== flakeVersion) {
    return {
      kind: 'version-mismatch',
      actual: version,
      expected: flakeVersion,
    };
  }

  return null;
};

const describeIssue = (issue: Issue): string => {
  switch (issue.kind) {
    case 'missing-flake-version':
      return '`NIX_PNPM_VERSION` is unset. Run inside the flake devShell (`nix develop`).';
    case 'missing-field':
      return 'Root package.json has no `packageManager` field.';
    case 'wrong-manager':
      return `Root package.json pins \`${issue.actual}\`; expected pnpm.`;
    case 'version-mismatch':
      return (
        `Root package.json pins pnpm@${issue.actual}, but the flake provides pnpm@${issue.expected}.\n` +
        `Fix: set \`"packageManager": "pnpm@${issue.expected}"\`.`
      );
  }
};

export default defineCommand({
  meta: {
    name: 'package-manager',
    description:
      "Check that the root `packageManager` field pins the flake's exact pnpm version.",
  },
  async run() {
    const manifestPath = path.join(process.cwd(), 'package.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
      packageManager?: string;
    };

    const issue = checkPackageManager(
      manifest.packageManager,
      process.env.NIX_PNPM_VERSION,
    );

    if (issue === null) {
      console.log("`packageManager` matches the flake's pnpm.");
      return;
    }

    console.error(describeIssue(issue));
    process.exitCode = 1;
  },
});
