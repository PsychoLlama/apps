import { defineAction, defineEffect } from '@lib/state';
import { readScratchpadFlag } from './capabilities';
import { scratchpadFlagStore } from './store';

/** Mirror the resolved flag value into the store. */
export const setScratchpadEnabled = defineAction(
  [scratchpadFlagStore],
  (flag, enabled: boolean) => {
    flag.enabled = enabled;
  },
);

/**
 * Reconcile the seeded default with any persisted OPFS override. Run on
 * mount — OPFS is client-only, unavailable during SSG.
 */
export const hydrateScratchpadFlagEffect = defineEffect(
  [],
  readScratchpadFlag,
  { onSuccess: setScratchpadEnabled },
);
