/**
 * Runtime API for the active appearance preferences. Kept on a separate
 * entry point from the package barrel so `.css.ts` consumers (which only
 * need the bundle + constants) don't transitively pull `@lib/state`,
 * `@lib/effects`, and `@lib/observability` into Vanilla Extract's child
 * compiler.
 *
 * The theme reads through {@link appearanceStore} and changes through
 * the sagas. Anchor {@link appearanceScope} for as long as a surface
 * shows it — the DOM attribute stays the canonical record, so a released
 * scope loses nothing a mount-time hydrate can't recover.
 *
 * The color scheme and motion are plans: read {@link $colorScheme} and
 * {@link $motion}, change them with {@link $selectColorScheme} and
 * {@link $selectMotion}.
 */
export { $colorScheme, $selectColorScheme } from './effects/color-scheme';
export { $motion, $selectMotion } from './effects/motion';
export { appearanceScope } from './scope';
export { appearanceStore, type AppearanceState } from './appearance';
export { readActiveColorScheme, readActiveMotion } from './capabilities';
export {
  hydrateAppearanceSaga,
  resetThemeSaga,
  selectThemeSaga,
} from './sagas';
