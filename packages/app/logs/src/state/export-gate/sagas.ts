import { call, commit, defineSaga } from '@lib/state';
import { isWorkerControlling, watchWorkerControl } from './capabilities';
import { workerControlChangedTopic } from './gate';
import { logsScope } from '../scope';

/**
 * Bring the export action's gating condition to life and keep it there. Opens
 * the change subscription, confirms who controls the page, then publishes
 * every later handoff for as long as the scope lives. This is the store's only
 * writer.
 *
 * `LogsView` runs it once on mount — the Service Worker API is client-only, so
 * it can't run during SSG.
 *
 * Order matters. Subscribing before the read means a handoff landing mid-read
 * is buffered rather than lost; draining after the read means it's replayed on
 * top of the snapshot instead of being clobbered by it.
 *
 * It never ends on its own. Releasing the last anchor aborts it, which drops
 * the subscription.
 */
export const trackExportGateSaga = defineSaga(logsScope, async function* () {
  const changes = yield* call(watchWorkerControl);

  const controlled = yield* call(isWorkerControlling);
  yield commit(workerControlChangedTopic(controlled));

  for await (const change of changes) {
    yield commit(workerControlChangedTopic(change));
  }
});
