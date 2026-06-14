#!/usr/bin/env node

/**
 * Entry for the `@dev/workspace-cli` tooling CLI. Subcommands live
 * in `./commands/`. Exposed as the `workspace` bin and also invoked
 * directly from turbo tasks via `node`.
 */

import { defineCommand, runMain } from 'citty';
import check from './commands/check.ts';
import patchWorkerd from './commands/patch-workerd.ts';

const main = defineCommand({
  meta: {
    name: 'workspace',
    description: 'Internal workspace tooling for the @dev/monorepo workspace.',
  },
  subCommands: {
    check,
    'patch-workerd': patchWorkerd,
  },
});

void runMain(main);
