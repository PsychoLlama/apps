/** Identifier for a built-in theme bundle. Matches `bundles/<id>.css.ts`. */
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

/** Display metadata for a single theme bundle. */
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
