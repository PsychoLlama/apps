import { inspect } from 'node:util';
import type { LogProcessor } from '@holz/core';
import type { Plugin } from 'vite';
import { LOG_EVENT } from './protocol/events';
import { deserializeLog } from './protocol/serialization';

const PLUGIN_NAME = '@holz/vite-backend';

// Vite's logger adds no plugin-name prefix, so we bring our own.
const LOG_TAG = `[${PLUGIN_NAME}]`;

/** Options for {@link holz}. */
export interface HolzConfig {
  /**
   * Receives every log forwarded from the browser, hydrated back into a
   * holz `Log` (errors included). The plugin does nothing else with them.
   */
  processor: LogProcessor;
}

/**
 * Vite plugin that receives logs from `createViteBackend()` over the dev
 * server's socket and hands them to the configured processor. Dev server
 * only; builds ignore it.
 *
 * `getConfig` runs once, while Vite resolves its config, so it can lazily
 * import server-only backends without burdening builds. If it throws, the
 * dev server fails to start.
 */
export const holz = (
  getConfig: () => HolzConfig | Promise<HolzConfig>,
): Plugin => {
  // Assigned in `config`, which Vite awaits before `configureServer`.
  let processor: LogProcessor;

  return {
    name: PLUGIN_NAME,
    apply: 'serve',

    async config() {
      ({ processor } = await getConfig());
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
