/**
 * Runtime API for the active appearance preferences. Kept on a separate
 * entry point from the package barrel so `.css.ts` consumers (which only
 * need the bundle + constants) don't transitively pull `@lib/state-next`
 * and `@lib/observability` into Vanilla Extract's child compiler.
 *
 * Reads go through the stores; changes go through the sagas. Anchor
 * {@link themeScope} for as long as a surface shows any of it — the DOM
 * attributes stay the canonical record, so a released scope loses nothing
 * a mount-time hydrate can't recover.
 */
export { themeScope } from './scope';
export { colorSchemeStore, motionStore, themeStore } from './store';
export { readActiveColorScheme, readActiveMotion } from './capabilities';
export {
  hydrateColorSchemeSaga,
  hydrateMotionSaga,
  hydrateThemeSaga,
  resetThemeSaga,
  selectColorSchemeSaga,
  selectMotionSaga,
  selectThemeSaga,
} from './sagas';
