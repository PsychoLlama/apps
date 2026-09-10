/**
 * State for the floating-UI experiment: every placement input the
 * floating window takes, plus the tether's middleware.
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
  flipModeChanged,
  floatingControls,
  middlewareChanged,
  pointChanged,
  radiusChanged,
  sideChanged,
  sideOffsetChanged,
  TETHER_MIDDLEWARE,
  type FlipMode,
  type TetherMiddleware,
} from './controls';
export {
  commitTetherDisabledSaga,
  resetControlsSaga,
  trackTetherConfigSaga,
} from './sagas';
export { scratchpadScope } from './scope';
