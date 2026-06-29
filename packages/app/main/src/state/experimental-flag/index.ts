/** The `@lib/state` surface gating the launcher's experimental card. */
export { experimentalFlag } from './store';
export { watchExperimentalFlag } from './capabilities';
export {
  hydrateExperimentalFlagEffect,
  setExperimentalEnabled,
} from './bindings';
