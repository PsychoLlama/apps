import { createLogger, toError } from '@lib/observability';
import { pruneLogs } from '@lib/holz-idb-backend';
import {
  pruneOverrides,
  type JsonValue,
  type Option,
} from '@lib/runtime-config';
import { filter as consoleLogFilter } from '@lib/observability/config';
import {
  enabled as scratchpadAppEnabled,
  tetherDisabled as scratchpadTetherDisabled,
} from '@app/scratchpad/config';

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
  scratchpadTetherDisabled,
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
 * longer exist, and trimming the log archive back under its cap. Later tasks of
 * the same character belong here too.
 */
export const runStartupTasks = (): void => {
  pruneOverrides(KNOWN_OPTIONS).catch((error: unknown) => {
    logger.error('Failed to prune stale config overrides.', {
      error: toError(error),
    });
  });

  // Cut back to half the ceiling so the archive coasts for another two
  // thousand logs before the next pass — most page loads find nothing to do.
  //
  // A successful pass says nothing: it would log into the store it just
  // trimmed, and the pass already leaves its own record behind for anyone
  // reading the archive later.
  pruneLogs({ maxRecords: 4_000, retainRecords: 2_000 }).catch(
    (error: unknown) => {
      logger.error('Failed to prune the log archive.', {
        error: toError(error),
      });
    },
  );
};
