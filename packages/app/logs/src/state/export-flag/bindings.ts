import { defineAction } from '@lib/state';
import { exportFlagStore } from './store';

/** Mirror the resolved flag value into the store. */
export const setExportEnabled = defineAction(
  [exportFlagStore],
  (flag, enabled: boolean) => {
    flag.enabled = enabled;
  },
);
