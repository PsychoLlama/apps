import { defineAction, defineEffect } from '@lib/state';
import { readExportFlag } from './capabilities';
import { exportFlagStore } from './store';

/** Mirror the resolved flag value into the store. */
export const setExportEnabled = defineAction(
  [exportFlagStore],
  (flag, enabled: boolean) => {
    flag.enabled = enabled;
  },
);

/**
 * Reconcile the seeded default with any persisted OPFS override. Run on
 * mount — OPFS is client-only, unavailable during SSG.
 */
export const hydrateExportFlagEffect = defineEffect([], readExportFlag, {
  onSuccess: setExportEnabled,
});
