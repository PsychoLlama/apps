import { defineEffect } from '@lib/state';
import { setExperimentalEnabled, setLogFilter } from './actions';
import {
  readExperimentalEnabled,
  readLogFilter,
  writeExperimentalEnabled,
  writeLogFilter,
} from './capabilities';

/**
 * Reconcile the seeded log filter default with any persisted OPFS
 * override. Run on mount — OPFS is client-only, unavailable during SSG.
 */
export const hydrateLogFilterEffect = defineEffect([], readLogFilter, {
  onSuccess: setLogFilter,
});

/**
 * Persist a new log filter pattern. The write echoes back through the
 * subscription, which is what actually updates the store.
 */
export const commitLogFilterEffect = defineEffect([], writeLogFilter);

/** Reconcile the seeded experimental flag with any persisted OPFS override. */
export const hydrateExperimentalEffect = defineEffect(
  [],
  readExperimentalEnabled,
  { onSuccess: setExperimentalEnabled },
);

/**
 * Persist the experimental flag. The write echoes back through the
 * subscription, which is what actually updates the store.
 */
export const commitExperimentalEffect = defineEffect(
  [],
  writeExperimentalEnabled,
);
