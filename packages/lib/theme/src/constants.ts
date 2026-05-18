/**
 * Pure data describing the theme system. Free of CSS side effects so
 * head-script preludes and other ahead-of-paint code can import the
 * canonical list without dragging the Vanilla Extract bundle into a
 * non-Vite build pipeline.
 *
 * `./bundles.css` consumes these to register CSS rules and exposes the
 * labelled `THEMES` list for picker UIs.
 */

/**
 * `dataset` key on `<html>` that selects the active theme. The matching
 * `:root[data-theme="<id>"]` rule emitted by the bundle wins by
 * specificity. Shared so the CSS selector, server stamp, prelude, and
 * storybook preview stay in lockstep — use as `dataset[THEME_ATTRIBUTE]`
 * in JS and pair with the `data-` prefix in CSS selectors.
 */
export const THEME_ATTRIBUTE = 'theme';

/**
 * Canonical list of built-in theme ids. Source of truth for theme
 * coverage — `bundles.css` types its variants object against this so
 * adding or removing an id without a matching CSS rule fails to
 * compile.
 */
export const THEME_IDS = [
  'blue',
  'brown',
  'cyan',
  'indigo',
  'iris',
  'jade',
  'orange',
  'pink',
  'plum',
  'purple',
  'sky',
  'teal',
  'violet',
] as const;

/** Identifier for a built-in theme. */
export type ThemeId = (typeof THEME_IDS)[number];

/**
 * Theme rendered when nothing else is selected. The server entry
 * stamps this onto `<html>` so the DOM never reaches the browser
 * with zero (or multiple) themes active.
 */
export const DEFAULT_THEME_ID: ThemeId = 'blue';

/**
 * `localStorage` key holding the user's selected theme id. The head
 * prelude reads this before paint to restamp `<html data-theme>`; the
 * settings picker writes it when the selection changes. Namespaced
 * under `preferences.appearance.*` so future siblings (light/dark
 * mode, motion, density) slot in alongside it.
 */
export const THEME_STORAGE_KEY = 'preferences.appearance.theme';
