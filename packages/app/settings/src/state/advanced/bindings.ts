import { defineEffect } from '@lib/state';
import { setAdvancedSettings } from './actions';
import {
  readAdvancedSettings,
  resetExperimentalEnabled,
  resetLogFilter,
  writeExperimentalEnabled,
  writeLogFilter,
} from './capabilities';

/**
 * Reconcile the seeded defaults with any persisted OPFS overrides. Reads
 * every option together and mirrors them in a single action. Run on
 * mount — OPFS is client-only, unavailable during SSG.
 */
export const hydrateAdvancedSettingsEffect = defineEffect(
  [],
  readAdvancedSettings,
  { onSuccess: setAdvancedSettings },
);

/**
 * Persist a new log filter pattern. The write echoes back through the
 * subscription, which is what actually updates the store.
 */
export const commitLogFilterEffect = defineEffect([], writeLogFilter);

/**
 * Persist the experimental flag. The write echoes back through the
 * subscription, which is what actually updates the store.
 */
export const commitExperimentalEffect = defineEffect(
  [],
  writeExperimentalEnabled,
);

/**
 * Revert the log filter to its default for the active environment. The
 * reset echoes back through the subscription, which updates the store.
 */
export const resetLogFilterEffect = defineEffect([], resetLogFilter);

/**
 * Revert the experimental flag to its default for the active environment.
 * The reset echoes back through the subscription, which updates the store.
 */
export const resetExperimentalEffect = defineEffect(
  [],
  resetExperimentalEnabled,
);
