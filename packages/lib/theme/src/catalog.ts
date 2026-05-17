/** Catalog of every built-in theme, in display order. */
export const THEMES = [
  { id: 'blue', label: 'Blue' },
  { id: 'sky', label: 'Sky' },
  { id: 'cyan', label: 'Cyan' },
  { id: 'teal', label: 'Teal' },
  { id: 'jade', label: 'Jade' },
  { id: 'indigo', label: 'Indigo' },
  { id: 'iris', label: 'Iris' },
  { id: 'violet', label: 'Violet' },
  { id: 'purple', label: 'Purple' },
  { id: 'plum', label: 'Plum' },
  { id: 'pink', label: 'Pink' },
  { id: 'orange', label: 'Orange' },
  { id: 'brown', label: 'Brown' },
] as const;

/**
 * Identifier for a built-in theme. The matching variant block in
 * `bundles.css.ts` is enforced via `satisfies Record<ThemeId, …>` so
 * adding an id here without a palette mapping (or vice versa) is a
 * type error.
 */
export type ThemeId = (typeof THEMES)[number]['id'];

/**
 * `dataset` key on `<html>` that selects the active theme. The matching
 * `:root[data-theme="<id>"]` rule emitted by the bundle wins by
 * specificity. Shared so the CSS selector, server stamp, and storybook
 * preview stay in lockstep — use as `dataset[THEME_ATTRIBUTE]` in JS
 * and pair with the `data-` prefix in CSS selectors.
 */
export const THEME_ATTRIBUTE = 'theme';

/**
 * Theme rendered when nothing else is selected. The server entry
 * stamps this onto `<html>` so the DOM never reaches the browser
 * with zero (or multiple) themes active.
 */
export const DEFAULT_THEME_ID: ThemeId = 'blue';
