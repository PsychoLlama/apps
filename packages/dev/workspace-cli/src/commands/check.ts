/**
 * `check` groups read-only validations for workspace config and
 * source layout. `check catalog` verifies that catalog'd deps are
 * referenced via `catalog:` rather than a literal version range.
 *
 * Bare `check` (no subcommand) runs every subcheck. Wired up to the
 * `workspace-check` turbo task; runs once per workspace and is cheap
 * to cache.
 */

import { defineCommand, runCommand } from 'citty';
import catalog from './check/catalog.ts';

export default defineCommand({
  meta: {
    name: 'check',
    description: 'Run workspace validation checks.',
  },
  subCommands: {
    catalog,
  },
  async run() {
    await runCommand(catalog, { rawArgs: [] });
  },
});
