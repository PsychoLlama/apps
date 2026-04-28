/**
 * `check` groups read-only validations for workspace config and
 * source layout. `check moon` verifies that declared moon task
 * inputs still resolve to real files or non-empty globs.
 * `check catalog` verifies that catalog'd deps are referenced via
 * `catalog:` rather than a literal version range.
 */

import { defineCommand } from 'citty';
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
});
