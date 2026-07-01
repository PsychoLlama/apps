import { defineAction } from '@lib/state';
import { workerControlStore } from './store';

/** Mirror the resolved control state into the store. */
export const setWorkerControlled = defineAction(
  [workerControlStore],
  (worker, controlled: boolean) => {
    worker.controlled = controlled;
  },
);
