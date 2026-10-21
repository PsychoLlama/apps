import { createSignal } from 'solid-js';
import { pipe, reactive } from '@lib/effects';

/**
 * Whether this origin has an active service worker, as a live accessor.
 * `false` until it activates, and always during SSG or where service
 * workers aren't supported. Once active, a worker stays active.
 */
export const $serviceWorkerActive = pipe([
  () => {
    const [active, setActive] = createSignal(false);

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      // Never rejects: it waits for a registration with an active worker.
      void navigator.serviceWorker.ready.then(() => setActive(true));
    }

    return reactive(active);
  },
]);
