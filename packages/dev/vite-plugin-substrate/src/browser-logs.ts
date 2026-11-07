import { mkdir, open } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createAnsiTerminalBackend } from '@holz/ansi-terminal-backend';
import { createGroup } from '@holz/core/functions';
import { createJsonBackend } from '@holz/json-backend';
import { holz } from '@lib/holz-vite-backend/server';

/**
 * Prints browser logs in the dev server's terminal. Set `HOLZ_LOG_FILE` to
 * also write them to that file as NDJSON, truncated on each start. Relative
 * paths resolve against the Vite root.
 */
export const browserLogs = () =>
  holz(async ({ root }) => {
    const terminal = createAnsiTerminalBackend();
    const { HOLZ_LOG_FILE } = process.env;
    if (!HOLZ_LOG_FILE) return { processor: terminal };

    // Opening the file up front means a failure stops the dev server
    // instead of surfacing later as an unhandled stream error.
    const path = resolve(root, HOLZ_LOG_FILE);
    await mkdir(dirname(path), { recursive: true });
    const file = await open(path, 'w');

    return {
      processor: createGroup([
        terminal,
        createJsonBackend({ stream: file.createWriteStream() }),
      ]),
    };
  });
