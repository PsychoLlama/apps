/**
 * The Advanced section's state: runtime-config options for debugging and
 * preview features, mirrored into a store the controls read.
 *
 * `@lib/runtime-config` owns the durable copy in OPFS and fans changes out
 * to every browsing context. `trackAdvancedSettingsSaga` subscribes to that
 * fan-out, which makes it the store's only writer — the commit and reset
 * sagas persist a change and let it come back around, so this tab learns
 * about its own writes exactly the way a sibling tab does.
 */
export { advancedDefaults, advancedSettingsStore } from './settings';
export { advancedSettingsScope } from './scope';
export {
  commitLogExportSaga,
  commitLogFilterSaga,
  commitScratchpadSaga,
  resetLogExportSaga,
  resetLogFilterSaga,
  resetScratchpadSaga,
  trackAdvancedSettingsSaga,
} from './sagas';
