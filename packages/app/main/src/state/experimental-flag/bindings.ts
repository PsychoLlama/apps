import { defineAction, defineEffect } from '@lib/state';
import { readExperimentalFlag } from './capabilities';
import { experimentalFlagStore } from './store';

/** Mirror the resolved flag value into the store. */
export const setExperimentalEnabled = defineAction(
  [experimentalFlagStore],
  (flag, enabled: boolean) => {
    flag.enabled = enabled;
  },
);

/**
 * Reconcile the seeded default with any persisted OPFS override. Run on
 * mount — OPFS is client-only, unavailable during SSG.
 */
export const hydrateExperimentalFlagEffect = defineEffect(
  [],
  readExperimentalFlag,
  { onSuccess: setExperimentalEnabled },
);
