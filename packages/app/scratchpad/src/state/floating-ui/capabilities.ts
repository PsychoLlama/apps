import {
  environment,
  readEnvironment,
  reset,
  subscribe,
  updateConfig,
  watchAll,
  type Override,
} from '@lib/runtime-config';
import { tetherDisabled as tetherDisabledOption } from '../../config';

/**
 * Resolve whether the tether is withheld for the active environment,
 * layering any persisted OPFS override over the built-in default.
 */
export const readTetherDisabled = async (): Promise<boolean> => {
  const { disabled } = await readEnvironment(tetherDisabledOption);
  return disabled;
};

/** Persist the tether toggle as the active environment's override. */
export const writeTetherDisabled = async (
  _signal: AbortSignal,
  disabled: boolean,
): Promise<void> => {
  const patch: Override<{ disabled: boolean }> = {
    [environment]: { disabled },
  };

  await updateConfig(tetherDisabledOption, patch);
};

/**
 * Clear the tether override for the active environment only, reverting it
 * to the built-in default. Other environments keep their overrides.
 */
export const resetTetherDisabled = (): Promise<void> =>
  reset(tetherDisabledOption, [environment]);

/**
 * Watch the tether toggle, reporting each resolved value as it lands.
 * Changes from any browsing context arrive here — sibling tabs, workers,
 * and this tab's own writes alike, which is what makes the subscription
 * the store's single source of truth rather than one of two.
 *
 * See {@link watchAll} for the buffering and teardown guarantees the
 * stream carries.
 */
export const watchTetherDisabled = (
  signal: AbortSignal,
): AsyncGenerator<boolean> =>
  watchAll(signal, (push) => [
    subscribe(tetherDisabledOption, ({ disabled }) => push(disabled)),
  ]);
