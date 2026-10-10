import { createLogger, toError } from '@lib/observability';
import { pruneLogs } from '@lib/holz-idb-backend';
import {
  pruneOverrides,
  type JsonValue,
  type Option,
} from '@lib/runtime-config';
import { filter as consoleLogFilter } from '@lib/observability/config';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Every runtime option this origin declares, from the app or its
 * libraries. `pruneOverrides` deletes the persisted override of anything
 * this list doesn't name.
 *
 * Add an entry here whenever this app gains a `defineConfig`.
 */
const KNOWN_OPTIONS: readonly Option<JsonValue>[] = [consoleLogFilter];

/**
 * Best-effort housekeeping, once per page load: drop overrides for options
 * that no longer exist and trim the log archive. Runs unawaited from the
 * app root's `onMount`.
 */
export const runStartupTasks = (): void => {
  pruneOverrides(KNOWN_OPTIONS).catch((error: unknown) => {
    logger.error('Failed to prune stale config overrides.', {
      error: toError(error),
    });
  });

  pruneLogs({ maxRecords: 4_000, retainRecords: 2_000 }).catch(
    (error: unknown) => {
      logger.error('Failed to prune the log archive.', {
        error: toError(error),
      });
    },
  );
};
