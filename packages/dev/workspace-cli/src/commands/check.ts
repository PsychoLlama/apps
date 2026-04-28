/**
 * `check` groups read-only validations for workspace config and
 * source layout. `check moon` verifies that declared moon task
 * inputs still resolve to real files or non-empty globs.
 */

import { defineCommand } from 'citty';
import moon from './check-moon.ts';

export default defineCommand({
  meta: {
    name: 'check',
    description: 'Run workspace validation checks.',
  },
  subCommands: {
    moon,
  },
});
