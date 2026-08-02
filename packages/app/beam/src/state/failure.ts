import { AbortError } from '@lib/state';
import { createLogger, toError } from '@lib/observability';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Build a `catch` handler for a saga run.
 *
 * Beam's sagas commit their own failures — an unreachable peer, an unreadable
 * disk — so the rejection left over is the abort from a released anchor,
 * which is ordinary teardown and nothing to report. Anything else is a bug,
 * and surfacing it beats letting it land as an unhandled rejection.
 *
 * Above the features because every view that runs a saga needs it, and none
 * of them should have to reach into the feature it belongs to.
 */
export const reportSagaFailure =
  (message: string) =>
  (error: unknown): void => {
    if (error instanceof AbortError) return;
    logger.error(message, { error: toError(error) });
  };
