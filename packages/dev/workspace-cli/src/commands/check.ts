/**
 * `check` groups read-only validations for workspace config and
 * source layout. `check moon` verifies that declared moon task
 * inputs still resolve to real files or non-empty globs.
 * `check catalog` verifies that catalog'd deps are referenced via
 * `catalog:` rather than a literal version range.
 *
 * Bare `check` (no subcommand) runs every subcheck. The single moon
 * task `@dev/workspace-cli:check` invokes this and lives in
 * `.moon/tasks.yml`'s `implicitDeps` — a single implicit dep
 * sidesteps the cycle that two sibling validator tasks would
 * otherwise form (each becoming the other's transitive dep).
 */

import { defineCommand, runCommand } from 'citty';
import moon from './check/moon.ts';
import catalog from './check/catalog.ts';

export default defineCommand({
  meta: {
    name: 'check',
    description: 'Run workspace validation checks.',
  },
  subCommands: {
    moon,
    catalog,
  },
  async run() {
    // Run every subcheck. Don't short-circuit on the first failure —
    // each sets `process.exitCode = 1` independently, so reporting
    // both surfaces is strictly more useful than reporting one.
    await runCommand(moon, { rawArgs: [] });
    await runCommand(catalog, { rawArgs: [] });
  },
});
