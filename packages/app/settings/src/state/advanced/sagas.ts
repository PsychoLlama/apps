import { call, commit, defineSaga } from '@lib/state-next';
import {
  readAdvancedSettings,
  resetBeamEnabled,
  resetLogExportEnabled,
  resetLogFilter,
  resetScratchpadEnabled,
  watchAdvancedSettings,
  writeBeamEnabled,
  writeLogExportEnabled,
  writeLogFilter,
  writeScratchpadEnabled,
} from './capabilities';
import { advancedSettingsScope } from './scope';
import {
  advancedSettingsRestoredTopic,
  beamChangedTopic,
  logExportChangedTopic,
  logFilterChangedTopic,
  scratchpadChangedTopic,
} from './settings';

/**
 * Bring the Advanced section to life and keep it there. Opens the change
 * subscription, reconciles the seeded defaults with whatever OPFS has
 * persisted, then publishes every later change for as long as the scope
 * lives. This is the store's only writer: the commit and reset sagas
 * below persist through `@lib/runtime-config`, and the change comes back
 * around here.
 *
 * `AdvancedSettings` runs it once as the section mounts — OPFS is
 * client-only, so it can't run during SSG.
 *
 * Order matters. Subscribing before the read means a change landing
 * mid-read is buffered rather than lost; draining after the restore means
 * it's replayed on top of the snapshot instead of being clobbered by it.
 *
 * It never ends on its own. Releasing the last anchor aborts it, which
 * drops the subscriptions.
 */
export const trackAdvancedSettingsSaga = defineSaga(
  advancedSettingsScope,
  async function* () {
    const changes = yield* call(watchAdvancedSettings);

    const values = yield* call(readAdvancedSettings);
    yield commit(advancedSettingsRestoredTopic(values));

    for await (const change of changes) {
      switch (change.option) {
        case 'logFilter':
          yield commit(logFilterChangedTopic(change.pattern));
          break;
        case 'logExport':
          yield commit(logExportChangedTopic(change.enabled));
          break;
        case 'scratchpad':
          yield commit(scratchpadChangedTopic(change.enabled));
          break;
        case 'beam':
          yield commit(beamChangedTopic(change.enabled));
          break;
      }
    }
  },
);

/**
 * Persist a new log filter pattern. Publishes nothing: the write echoes
 * back through the subscription, which is what updates the store.
 */
export const commitLogFilterSaga = defineSaga(
  advancedSettingsScope,
  async function* (pattern: string) {
    yield* call(writeLogFilter, pattern);
  },
);

/**
 * Revert the log filter to its default for the active environment. The
 * reset echoes back through the subscription, which updates the store.
 */
export const resetLogFilterSaga = defineSaga(
  advancedSettingsScope,
  async function* () {
    yield* call(resetLogFilter);
  },
);

/** Persist the logs export flag. Echoes back like {@link commitLogFilterSaga}. */
export const commitLogExportSaga = defineSaga(
  advancedSettingsScope,
  async function* (enabled: boolean) {
    yield* call(writeLogExportEnabled, enabled);
  },
);

/** Revert the logs export flag to its default for the active environment. */
export const resetLogExportSaga = defineSaga(
  advancedSettingsScope,
  async function* () {
    yield* call(resetLogExportEnabled);
  },
);

/** Persist the scratchpad flag. Echoes back like {@link commitLogFilterSaga}. */
export const commitScratchpadSaga = defineSaga(
  advancedSettingsScope,
  async function* (enabled: boolean) {
    yield* call(writeScratchpadEnabled, enabled);
  },
);

/** Revert the scratchpad flag to its default for the active environment. */
export const resetScratchpadSaga = defineSaga(
  advancedSettingsScope,
  async function* () {
    yield* call(resetScratchpadEnabled);
  },
);

/** Persist the beam flag. Echoes back like {@link commitLogFilterSaga}. */
export const commitBeamSaga = defineSaga(
  advancedSettingsScope,
  async function* (enabled: boolean) {
    yield* call(writeBeamEnabled, enabled);
  },
);

/** Revert the beam flag to its default for the active environment. */
export const resetBeamSaga = defineSaga(
  advancedSettingsScope,
  async function* () {
    yield* call(resetBeamEnabled);
  },
);
