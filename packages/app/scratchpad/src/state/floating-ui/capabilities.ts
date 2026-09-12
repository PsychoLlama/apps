import {
  environment,
  readEnvironment,
  reset,
  subscribe,
  updateConfig,
  watchAll,
  type Override,
} from '@lib/runtime-config';
import { tetherEnabled as tetherEnabledOption } from '../../config';

/**
 * Resolve whether the tether is in charge for the active environment,
 * layering any persisted OPFS override over the built-in default.
 */
export const readTetherEnabled = async (): Promise<boolean> => {
  const { enabled } = await readEnvironment(tetherEnabledOption);
  return enabled;
};

/** Persist the tether toggle as the active environment's override. */
export const writeTetherEnabled = async (
  _signal: AbortSignal,
  enabled: boolean,
): Promise<void> => {
  const patch: Override<{ enabled: boolean }> = {
    [environment]: { enabled },
  };

  await updateConfig(tetherEnabledOption, patch);
};

/**
 * Clear the tether override for the active environment only, reverting it
 * to the built-in default. Other environments keep their overrides.
 */
export const resetTetherEnabled = (): Promise<void> =>
  reset(tetherEnabledOption, [environment]);

/**
 * Watch the tether toggle, reporting each resolved value as it lands.
 * Changes from any browsing context arrive here — sibling tabs, workers,
 * and this tab's own writes alike, which is what makes the subscription
 * the store's single source of truth rather than one of two.
 *
 * See {@link watchAll} for the buffering and teardown guarantees the
 * stream carries.
 */
export const watchTetherEnabled = (
  signal: AbortSignal,
): AsyncGenerator<boolean> =>
  watchAll(signal, (push) => [
    subscribe(tetherEnabledOption, ({ enabled }) => push(enabled)),
  ]);
