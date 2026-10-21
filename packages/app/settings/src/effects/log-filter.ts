import { pipe } from '@lib/effects';
import {
  environment,
  getDefaultValue,
  reset,
  updateConfig,
} from '@lib/runtime-config';
import { observeOption } from '@lib/runtime-config/effects';
import { filter } from '@lib/observability/config';

/** The active environment's built-in log filter: what a reset reverts to. */
export const defaultLogFilter = getDefaultValue(filter).pattern;

/**
 * The console log filter for the active environment as a live accessor,
 * with any persisted OPFS override layered over the default. Changes from
 * any browsing context land here, this tab's own writes included.
 * Releasing the plan drops the subscription.
 */
export const $logFilter = pipe([() => observeOption(filter)]);

/**
 * Persist a new log filter pattern as the active environment's override.
 * The write echoes back through the subscription `$logFilter` holds.
 */
export const $updateFilter = pipe([
  () =>
    (pattern: string): Promise<void> =>
      updateConfig(filter, { [environment]: { pattern } }),
]);

/**
 * Clear the log filter override for the active environment only, reverting
 * it to the built-in default. Other environments keep their overrides. The
 * reset echoes back through the subscription `$logFilter` holds.
 */
export const $resetFilter = pipe([
  () => (): Promise<void> => reset(filter, [environment]),
]);
