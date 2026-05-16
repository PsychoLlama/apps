/** Identifier for a built-in theme. Matches `bundles/<id>.css.ts`. */
export type ThemeId =
  | 'blue'
  | 'brown'
  | 'cyan'
  | 'indigo'
  | 'iris'
  | 'jade'
  | 'orange'
  | 'pink'
  | 'plum'
  | 'purple'
  | 'sky'
  | 'teal'
  | 'violet';

/**
 * Attribute name on `:root` that selects which theme is active. The
 * matching `:root[data-theme="<id>"]` rule emitted by each bundle wins
 * by specificity. Shared so the CSS selector and the DOM/JSX writers
 * stay in lockstep.
 */
export const THEME_ATTRIBUTE = 'data-theme';

/**
 * Theme rendered when nothing else is selected. The server entry
 * stamps this onto `<html>` so the DOM never reaches the browser
 * with zero (or multiple) themes active.
 */
export const DEFAULT_THEME_ID: ThemeId = 'blue';

/** Display metadata for a single theme. */
export interface ThemeEntry {
  /** Stable identifier matching the bundle filename. */
  id: ThemeId;
  /** Human-readable name shown in pickers. */
  label: string;
}

/** Catalog of every built-in theme, in display order. */
export const THEMES: readonly ThemeEntry[] = [
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
];
