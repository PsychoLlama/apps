/**
 * State for the floating-UI experiment: every placement input the
 * floating window takes, the tether's collision config, and what the
 * tether measured back.
 *
 * All of it is page-local and dies with the route — except
 * `tetherDisabled`, which `@lib/runtime-config` persists to OPFS and fans
 * out to every browsing context. `trackTetherConfigSaga` subscribes to
 * that fan-out, making it that field's only writer.
 */

export {
  alignChanged,
  alignOffsetChanged,
  arrowBaseChanged,
  arrowDepthChanged,
  arrowVisibilityChanged,
  behaviorsChanged,
  controlsReset,
  flipModeChanged,
  floatingControls,
  pointChanged,
  radiusChanged,
  sideChanged,
  sideOffsetChanged,
  tetherPaddingChanged,
  TETHER_FEATURES,
  type FlipMode,
  type TetherBehavior,
} from './controls';
export { availableRoomChanged, floatingMeasurement } from './measurement';
export {
  commitTetherDisabledSaga,
  resetControlsSaga,
  trackTetherConfigSaga,
} from './sagas';
export { scratchpadScope } from './scope';
