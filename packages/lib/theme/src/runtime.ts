/**
 * Runtime API for the active appearance preferences. Kept on a separate
 * entry point from the package barrel so `.css.ts` consumers (which only
 * need the bundle + constants) don't transitively pull `@lib/state`,
 * `@lib/effects`, and `@lib/observability` into Vanilla Extract's child
 * compiler.
 *
 * Theme and motion read through {@link appearanceStore} and change
 * through the sagas. Anchor {@link appearanceScope} for as long as a
 * surface shows either — the DOM attributes stay the canonical record, so
 * a released scope loses nothing a mount-time hydrate can't recover.
 *
 * The color scheme is a plan: read {@link $colorScheme}, change it with
 * {@link $selectColorScheme}.
 */
export { $colorScheme, $selectColorScheme } from './effects/color-scheme';
export { appearanceScope } from './scope';
export { appearanceStore, type AppearanceState } from './appearance';
export { readActiveColorScheme, readActiveMotion } from './capabilities';
export {
  hydrateAppearanceSaga,
  resetThemeSaga,
  selectMotionSaga,
  selectThemeSaga,
} from './sagas';
