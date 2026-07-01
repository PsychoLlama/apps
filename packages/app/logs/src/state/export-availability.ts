/**
 * Composition over the two conditions gating the logs export action: the
 * per-environment feature flag (`./export-flag`) and whether a service worker
 * controls the page to answer the download (`./worker-control`). Both are
 * client-only and read together on mount, so one effect reconciles them into a
 * single reactive flush rather than dispatching twice. The per-condition
 * watchers take over for later changes.
 */

import { defineAction, defineEffect } from '@lib/state';
import { readExportFlag } from './export-flag/capabilities';
import { exportFlagStore } from './export-flag/store';
import { isWorkerControlling } from './worker-control/capabilities';
import { workerControlStore } from './worker-control/store';

/** The resolved state of both conditions gating the export action. */
interface ExportAvailability {
  /** Whether logs export is enabled for the active environment. */
  enabled: boolean;
  /** Whether a service worker controls the page to answer the download. */
  controlled: boolean;
}

/** Resolve both gating conditions — the OPFS-backed flag and SW control. */
const readExportAvailability = async (): Promise<ExportAvailability> => ({
  enabled: await readExportFlag(),
  controlled: isWorkerControlling(),
});

/** Land both resolved conditions across their stores in one reactive flush. */
const setExportAvailability = defineAction(
  [exportFlagStore, workerControlStore],
  (flag, worker, availability: ExportAvailability) => {
    flag.enabled = availability.enabled;
    worker.controlled = availability.controlled;
  },
);

/**
 * Reconcile both gating conditions on mount — the persisted flag override and
 * the page's service-worker control, both client-only and unavailable during
 * SSG. One effect, one action, one flush.
 */
export const hydrateExportAvailabilityEffect = defineEffect(
  [],
  readExportAvailability,
  { onSuccess: setExportAvailability },
);
