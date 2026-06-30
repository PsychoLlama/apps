import { defineEffect } from '@lib/state';
import { setAdvancedSettings } from './actions';
import {
  readAdvancedSettings,
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
