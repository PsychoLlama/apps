/// <reference types="@dev/build/vite-plugin/css-asset-types" />
import blue from './bundles/blue.css.ts?css-asset';
import brown from './bundles/brown.css.ts?css-asset';
import cyan from './bundles/cyan.css.ts?css-asset';
import indigo from './bundles/indigo.css.ts?css-asset';
import iris from './bundles/iris.css.ts?css-asset';
import jade from './bundles/jade.css.ts?css-asset';
import orange from './bundles/orange.css.ts?css-asset';
import pink from './bundles/pink.css.ts?css-asset';
import plum from './bundles/plum.css.ts?css-asset';
import purple from './bundles/purple.css.ts?css-asset';
import sky from './bundles/sky.css.ts?css-asset';
import teal from './bundles/teal.css.ts?css-asset';
import violet from './bundles/violet.css.ts?css-asset';

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
  /**
   * URL of the standalone CSS bundle for this theme — a sibling CSS
   * asset emitted by the `css-asset` Vite plugin. Resolves to a
   * placeholder string at compile time and a real hashed URL after
   * the client build's `generateBundle` runs.
   */
  bundleUrl: string;
}

/** Catalog of every built-in theme, in display order. */
export const THEMES: readonly ThemeEntry[] = [
  { id: 'blue', label: 'Blue', bundleUrl: blue },
  { id: 'sky', label: 'Sky', bundleUrl: sky },
  { id: 'cyan', label: 'Cyan', bundleUrl: cyan },
  { id: 'teal', label: 'Teal', bundleUrl: teal },
  { id: 'jade', label: 'Jade', bundleUrl: jade },
  { id: 'indigo', label: 'Indigo', bundleUrl: indigo },
  { id: 'iris', label: 'Iris', bundleUrl: iris },
  { id: 'violet', label: 'Violet', bundleUrl: violet },
  { id: 'purple', label: 'Purple', bundleUrl: purple },
  { id: 'plum', label: 'Plum', bundleUrl: plum },
  { id: 'pink', label: 'Pink', bundleUrl: pink },
  { id: 'orange', label: 'Orange', bundleUrl: orange },
  { id: 'brown', label: 'Brown', bundleUrl: brown },
];
