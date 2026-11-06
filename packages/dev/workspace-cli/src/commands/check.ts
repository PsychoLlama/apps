/**
 * `check` groups read-only validations for workspace config and
 * source layout. `check package-manager` verifies that
 * `packageManager` pins the flake's exact pnpm version.
 *
 * Bare `check` (no subcommand) runs every subcheck in parallel. Wired
 * up to the `workspace:check` turbo task; runs once per workspace and
 * is cheap to cache.
 */

import { defineCommand, runCommand } from 'citty';
import packageManager from './check/package-manager.ts';

export default defineCommand({
  meta: {
    name: 'check',
    description: 'Run workspace validation checks.',
  },
  subCommands: {
    'package-manager': packageManager,
  },
  async run({ rawArgs }) {
    // citty runs the parent's `run` after a subcommand too. Only fan
    // out for bare `check`.
    if (rawArgs.length > 0) return;

    await Promise.all([runCommand(packageManager, { rawArgs: [] })]);
  },
});
