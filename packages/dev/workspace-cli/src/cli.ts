#!/usr/bin/env node

/**
 * Entry for the `@dev/workspace-cli` tooling CLI. Subcommands live
 * in `./commands/`. Exposed as the `workspace` bin and also invoked
 * directly from moon tasks via `node`.
 */

import { defineCommand, runMain } from 'citty';
import check from './commands/check.ts';

const main = defineCommand({
  meta: {
    name: 'workspace',
    description: 'Internal workspace tooling for the @app/apps monorepo.',
  },
  subCommands: {
    check,
  },
});

void runMain(main);
