import { createStore, defineStore } from '@lib/state';

/** Whether an active service worker controls this page. */
export interface WorkerControlState {
  /**
   * `true` once a service worker controls the page and will therefore
   * intercept same-origin navigations. The export download is answered
   * entirely by the worker, so this gates the action's visibility: without a
   * controlling worker the navigation escapes to the network and 404s.
   *
   * Seeded `false` — there is no worker during SSG, and on the client's first
   * paint control isn't yet confirmed. A mount-time effect reconciles it and
   * tracks later handoffs.
   */
  controlled: boolean;
}

/** Source of truth for whether the service worker can serve local routes. */
export const workerControlStore = defineStore<WorkerControlState>(() => ({
  controlled: false,
}));

/** Live, readonly view of service-worker control. */
export const workerControl = createStore(workerControlStore);
