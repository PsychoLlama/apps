import { env, stderr } from 'node:process';
import { createAnsiTerminalBackend } from '@holz/ansi-terminal-backend';
import { type LogProcessor, filter } from '@holz/core';
import { createEnvironmentFilter } from '@holz/env-filter';
import { createLogCollector } from '@holz/log-collector';
import { createStreamBackend } from '@holz/stream-backend';

// Cached at module load. The filter runs on every log, so we don't
// want to re-touch `process.env` (and re-do its proxy traps) per call.
const { NODE_ENV } = env;
const isColorTerminal = stderr.isTTY && stderr.getColorDepth() > 1;

export const processor: LogProcessor = createLogCollector({
  fallback: filter(
    () => NODE_ENV !== 'test',
    createEnvironmentFilter({
      defaultPattern: '',
      processor: isColorTerminal
        ? createAnsiTerminalBackend()
        : createStreamBackend({ stream: stderr }),
    }),
  ),
});
