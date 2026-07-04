import { defineAction, defineEffect } from '@lib/state';
import { readBeamFlag } from './capabilities';
import { beamFlagStore } from './store';

/** Mirror the resolved flag value into the store. */
export const setBeamEnabled = defineAction(
  [beamFlagStore],
  (flag, enabled: boolean) => {
    flag.enabled = enabled;
  },
);

/**
 * Reconcile the seeded default with any persisted OPFS override. Run on
 * mount — OPFS is client-only, unavailable during SSG.
 */
export const hydrateBeamFlagEffect = defineEffect([], readBeamFlag, {
  onSuccess: setBeamEnabled,
});
