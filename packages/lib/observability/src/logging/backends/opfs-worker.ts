import type { LogProcessor } from '@holz/core';
import ObservabilityWorker from '../../worker/index?worker';

/**
 * A log backend that will ship logs to the observability worker for
 * off-main-thread persistence to OPFS. Spawns the worker eagerly — the moment
 * the backend is created — so it's warm before the first log arrives.
 *
 * Must be created on the browser main thread: only it can construct a
 * `Worker`, and spawning from inside a worker would loop. The pipeline links
 * this in behind `inMainThread` (see `../processor.browser.ts`), which is the
 * sole guard — calling it off the main thread is a wiring bug, not a runtime
 * input to defend against.
 */
export const createOpfsWorkerBackend = (): LogProcessor => {
  // `name` surfaces in DevTools' thread list and is readable inside the
  // worker as `self.name` — a stable label beats the anonymous default.
  const worker = new ObservabilityWorker({ name: 'Observability' });

  return () => {
    // TODO: forward the log to `worker` for OPFS persistence. The worker has
    // no sink yet — and there's plenty to build before it does — so drop logs
    // for now. `void` keeps the handle alive until the forwarding lands.
    void worker;
  };
};
