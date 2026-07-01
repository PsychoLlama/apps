import { defineAction, defineEffect } from '@lib/state';
import { isWorkerControlling } from './capabilities';
import { workerControlStore } from './store';

/** Mirror the resolved control state into the store. */
export const setWorkerControlled = defineAction(
  [workerControlStore],
  (worker, controlled: boolean) => {
    worker.controlled = controlled;
  },
);

/**
 * Read whether a worker already controls the page. Run on mount —
 * `navigator.serviceWorker` is client-only, absent during SSG. Reconnects the
 * subsequent {@link watchWorkerControl} subscription to the current truth.
 */
export const hydrateWorkerControlEffect = defineEffect(
  [],
  isWorkerControlling,
  {
    onSuccess: setWorkerControlled,
  },
);
