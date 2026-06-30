import { defineAction, defineEffect } from '@lib/state';
import { readShareFlag } from './capabilities';
import { shareFlagStore } from './store';

/** Mirror the resolved flag value into the store. */
export const setShareEnabled = defineAction(
  [shareFlagStore],
  (flag, enabled: boolean) => {
    flag.enabled = enabled;
  },
);

/**
 * Reconcile the seeded default with any persisted OPFS override. Run on
 * mount — OPFS is client-only, unavailable during SSG.
 */
export const hydrateShareFlagEffect = defineEffect([], readShareFlag, {
  onSuccess: setShareEnabled,
});
