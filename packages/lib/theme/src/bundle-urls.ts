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
import type { ThemeId } from './catalog.css';

/**
 * URL of the standalone CSS bundle for each theme. Each entry is a
 * sibling CSS asset emitted by the `css-asset` Vite plugin — importing
 * pulls in the bundle's chunk metadata, not its runtime code.
 */
export const bundleUrls: Record<ThemeId, string> = {
  blue,
  brown,
  cyan,
  indigo,
  iris,
  jade,
  orange,
  pink,
  plum,
  purple,
  sky,
  teal,
  violet,
};
