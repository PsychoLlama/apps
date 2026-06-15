import type { LogProcessor } from '@holz/core';
import ObservabilityWorker from '../../worker/index?worker';
import { inMainThread } from '../environment.ts';

/**
 * A log backend that ships logs to the observability worker for
 * off-main-thread persistence to OPFS. Spawns the worker eagerly — the moment
 * the backend is created — so it's warm before the first log arrives.
 *
 * Must be created on the browser main thread: only it can construct a
 * `Worker`, and spawning from inside a worker would loop. The pipeline links
 * this in behind {@link inMainThread} (see `../processor.browser.ts`); the
 * same guard is asserted here so a stray off-thread call fails loudly instead
 * of throwing a bare `ReferenceError` on `Worker`.
 */
export const createOpfsWorkerBackend = (): LogProcessor => {
  if (!inMainThread) {
    throw new Error(
      'createOpfsWorkerBackend must run on the browser main thread.',
    );
  }

  // `name` surfaces in DevTools' thread list and is readable inside the
  // worker as `self.name` — a stable label beats the anonymous default.
  const worker = new ObservabilityWorker({ name: 'Observability' });

  // Forward every log for off-main-thread persistence. The worker drops them
  // for now — it has no OPFS sink yet — but wiring the pipeline here means
  // logs flow the instant that sink lands.
  return (log) => {
    worker.postMessage(log);
  };
};
