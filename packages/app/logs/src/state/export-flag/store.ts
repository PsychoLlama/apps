import { createStore, defineStore } from '@lib/state';
import { environment } from '@lib/runtime-config';
import { logExport } from '../../config';

/** Whether the export action surfaces in the logs header. */
export interface ExportFlagState {
  /**
   * `true` when logs export is enabled for the active environment. Seeded
   * from the option's per-environment default so prerender and the
   * client's first paint agree (no hydration flash); a client-only effect
   * then reconciles it with any persisted OPFS override.
   */
  enabled: boolean;
}

/** Source of truth for the logs header's export-action visibility. */
export const exportFlagStore = defineStore<ExportFlagState>(() => ({
  enabled: logExport.defaults[environment].enabled,
}));

/** Live, readonly view of the export flag. */
export const exportFlag = createStore(exportFlagStore);
