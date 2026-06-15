import ObservabilityWorker from './worker/index?worker';

/**
 * Spawn the observability worker and return its handle. Call once during
 * client bootstrap (see `@app/main`'s client entry). The worker does
 * nothing yet — this is the seam later work will build the off-main-thread
 * telemetry pipeline onto.
 *
 * Throws if called outside the browser main thread. The DOM `Worker`
 * constructor only exists there; off it (during SSR, or from inside a
 * worker — where a self-spawn would loop) a call is a programming error, so
 * it surfaces loudly rather than silently no-oping.
 */
export const spawnObservabilityWorker = (): Worker => {
  if (!('document' in globalThis) || !('Worker' in globalThis)) {
    throw new Error(
      'spawnObservabilityWorker must run on the browser main thread.',
    );
  }

  return new ObservabilityWorker();
};
