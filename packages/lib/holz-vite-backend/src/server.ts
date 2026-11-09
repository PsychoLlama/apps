import { inspect } from 'node:util';
import type { LogProcessor } from '@holz/core';
import type { Plugin, ResolvedConfig } from 'vite';
import { LOG_EVENT } from './protocol/events.ts';
import { deserializeLog } from './protocol/serialization.ts';

const PLUGIN_NAME = '@holz/vite-backend';

// Vite's logger adds no plugin-name prefix, so we bring our own.
const LOG_TAG = `[${PLUGIN_NAME}]`;

/**
 * Vite plugin that receives logs from `createViteBackend()` over the dev
 * server's socket and hands them, hydrated back into holz `Log`s (errors
 * included), to a processor. Dev server only; builds ignore it.
 *
 * The processor comes from a function, sync or async, given Vite's resolved
 * config (e.g. to place files under `root`). It runs once, before the server
 * starts, so it can lazily import server-only backends without burdening
 * builds. If it fails, the dev server fails to start.
 *
 * Disables Vite's `server.forwardConsole` unless the app sets it explicitly.
 */
export const holz = (
  createProcessor: (
    config: ResolvedConfig,
  ) => LogProcessor | Promise<LogProcessor>,
): Plugin => {
  // Assigned in `configResolved`, which Vite awaits before `configureServer`.
  let processor: LogProcessor;

  return {
    name: PLUGIN_NAME,
    apply: 'serve',

    config(config) {
      // Vite's console forwarding sends browser console output to the same
      // terminal, flattened to strings, and duplicates whatever the browser
      // backends also print to the console. It's on by default under coding
      // agents. Turn it off unless the app opted in explicitly.
      if (config.server?.forwardConsole === undefined) {
        return { server: { forwardConsole: false } };
      }
    },

    async configResolved(config) {
      processor = await createProcessor(config);
    },

    configureServer(server) {
      const { logger } = server.config;

      // Vite invokes custom-event listeners unguarded from the socket's
      // message handler, so an uncaught throw here crashes the dev server.
      server.environments.client.hot.on(LOG_EVENT, (log) => {
        try {
          processor(deserializeLog(log));
        } catch (error) {
          // Vite's logger never prints `options.error` (it only dedupes on
          // it) and takes no format args, so the error goes in the message.
          logger.error(`${LOG_TAG} Log processor threw.\n${inspect(error)}`, {
            error: error instanceof Error ? error : undefined,
            timestamp: true,
          });
        }
      });
    },
  };
};
