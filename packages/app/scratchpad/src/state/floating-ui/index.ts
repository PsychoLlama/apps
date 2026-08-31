/**
 * State for the floating-UI experiment: every placement input the
 * floating window takes, plus the anchor handle the tether measures
 * against.
 *
 * All of it is page-local and dies with the route — except
 * `tetherDisabled`, which `@lib/runtime-config` persists to OPFS and fans
 * out to every browsing context. `trackTetherConfigSaga` subscribes to
 * that fan-out, making it that field's only writer.
 */

export {
  alignChanged,
  alignOffsetChanged,
  anchorCaptured,
  anchorElement,
  arrowAlignChanged,
  arrowBaseChanged,
  arrowDepthChanged,
  arrowVisibilityChanged,
  behaviorsChanged,
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
export {
  commitTetherDisabledSaga,
  resetControlsSaga,
  trackTetherConfigSaga,
} from './sagas';
export { scratchpadScope } from './scope';
