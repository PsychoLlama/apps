import { createLogger, toError } from '@lib/observability';
import {
  pruneOverrides,
  type JsonValue,
  type Option,
} from '@lib/runtime-config';
import { filter as consoleLogFilter } from '@lib/observability/config';
import { enabled as scratchpadAppEnabled } from '@app/scratchpad/config';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Every runtime option this origin declares, from any app or library.
 *
 * The whole suite ships as one origin, so all of it shares a single OPFS
 * directory of persisted overrides. `pruneOverrides` deletes whatever this
 * list doesn't name — an option missing from here loses its override the
 * next time the app loads, however faithfully its own package declares it.
 *
 * Add an entry here whenever you add a `defineConfig` anywhere.
 */
const KNOWN_OPTIONS: readonly Option<JsonValue>[] = [
  consoleLogFilter,
  scratchpadAppEnabled,
];

/**
 * Housekeeping the app runs once per page load, whichever route the visitor
 * landed on. Every task here is best-effort background maintenance: nothing
 * on screen waits for one, and a failure is logged rather than surfaced.
 *
 * Returns immediately — the work runs unawaited. Call it from the app root's
 * `onMount`, which keeps it off the prerender (OPFS is client-only) and off
 * the critical path.
 *
 * Today that's clearing the persisted remains of runtime options that no
 * longer exist. Later tasks of the same character belong here too.
 */
export const runStartupTasks = (): void => {
  pruneOverrides(KNOWN_OPTIONS).catch((error: unknown) => {
    logger.error('Failed to prune stale config overrides.', {
      error: toError(error),
    });
  });
};
