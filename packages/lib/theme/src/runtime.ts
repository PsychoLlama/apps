/**
 * Runtime API for the active appearance preferences. Kept on a separate
 * entry point from the package barrel so `.css.ts` consumers (which only
 * need the bundle + constants) don't transitively pull `@lib/effects`
 * and `@lib/observability` into Vanilla Extract's child compiler.
 *
 * Each preference is a plan: read {@link $theme}, {@link $colorScheme},
 * and {@link $motion}, and change them with the matching actions. The
 * `<html>` attributes the prelude stamps stay the canonical record.
 */
export { $colorScheme, $selectColorScheme } from './effects/color-scheme';
export { $motion, $selectMotion } from './effects/motion';
export { $resetTheme, $selectTheme, $theme } from './effects/theme';
export { readActiveColorScheme, readActiveMotion } from './capabilities';
