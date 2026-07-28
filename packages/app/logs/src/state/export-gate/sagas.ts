import { call, commit, defineSaga } from '@lib/state-next';
import { readExportGate, watchExportGate } from './capabilities';
import {
  exportFlagChangedTopic,
  exportGateRestoredTopic,
  workerControlChangedTopic,
} from './gate';
import { logsScope } from '../scope';

/**
 * Bring the export action's gating conditions to life and keep them there.
 * Opens the change subscription, reconciles the seeded defaults with the
 * persisted override and the page's actual controller, then publishes every
 * later change for as long as the scope lives. This is the store's only
 * writer.
 *
 * `LogsView` runs it once on mount — OPFS and the Service Worker API are both
 * client-only, so neither can run during SSG.
 *
 * Order matters. Subscribing before the read means a change landing mid-read
 * is buffered rather than lost; draining after the restore means it's replayed
 * on top of the snapshot instead of being clobbered by it.
 *
 * It never ends on its own. Releasing the last anchor aborts it, which drops
 * the subscriptions.
 */
export const trackExportGateSaga = defineSaga(logsScope, async function* () {
  const changes = yield* call(watchExportGate);

  const values = yield* call(readExportGate);
  yield commit(exportGateRestoredTopic(values));

  for await (const change of changes) {
    switch (change.source) {
      case 'flag':
        yield commit(exportFlagChangedTopic(change.enabled));
        break;
      case 'worker':
        yield commit(workerControlChangedTopic(change.controlled));
        break;
    }
  }
});
