/**
 * Runtime API for the active appearance preferences. Kept on a separate
 * entry point from the package barrel so `.css.ts` consumers (which only
 * need the bundle + constants) don't transitively pull `@lib/state`
 * and `@lib/observability` into Vanilla Extract's child compiler.
 *
 * Reads go through {@link appearanceStore}; changes go through the sagas.
 * Anchor {@link appearanceScope} for as long as a surface shows any of it —
 * the DOM attributes stay the canonical record, so a released scope loses
 * nothing a mount-time hydrate can't recover.
 */
export { appearanceScope } from './scope';
export { appearanceStore, type AppearanceState } from './appearance';
export { readActiveColorScheme, readActiveMotion } from './capabilities';
export {
  hydrateAppearanceSaga,
  resetThemeSaga,
  selectColorSchemeSaga,
  selectMotionSaga,
  selectThemeSaga,
} from './sagas';
