/**
 * Entry for the `@dev/cli` workspace tooling CLI. Subcommands live
 * in `./commands/`. Invoked from moon tasks via `node` directly —
 * no `bin` registration, no PATH hijacking.
 */

import { defineCommand, runMain } from 'citty';
import validateMoon from './commands/validate-moon.ts';

const main = defineCommand({
  meta: {
    name: 'apps-dev',
    description: 'Internal workspace tooling for the @app/apps monorepo.',
  },
  subCommands: {
    'validate-moon': validateMoon,
  },
});

void runMain(main);
