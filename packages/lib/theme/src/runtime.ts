/**
 * Runtime API for the active theme selection. Kept on a separate entry
 * point from the package barrel so `.css.ts` consumers (which only need
 * the bundle + constants) don't transitively pull `@lib/state` and
 * `@lib/observability` into Vanilla Extract's child compiler.
 */
export { theme } from './store';
export { hydrateThemeEffect, selectThemeEffect, setTheme } from './bindings';
