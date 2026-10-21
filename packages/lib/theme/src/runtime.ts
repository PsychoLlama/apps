/**
 * Runtime API for the active appearance preferences. Kept on a separate
 * entry point from the package barrel so `.css.ts` consumers (which only
 * need the bundle + constants) don't transitively pull `@lib/effects`
 * and `@lib/state` into Vanilla Extract's child compiler.
 *
 * Read every preference from {@link $appearance}, and change one by
 * name with {@link $setAppearance}. The `<html>` attributes the prelude
 * stamps carry them between page loads.
 */
export { $setAppearance } from './effects/appearance';
export { $appearance } from './state/appearance';
