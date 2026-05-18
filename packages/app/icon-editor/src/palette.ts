/**
 * Curated icon-editor palette set sampled from Radix's primary hues.
 * Each entry pairs a `bg` (light scale step 9) with a `fg` (the
 * palette's `contrast` value, typically white but darker for
 * high-luminance hues like yellow or sky). Shipped as raw hex so the
 * SVG export stays portable across consumers' color schemes.
 *
 * Imports pick single steps from per-variant files so the bundle
 * carries only the values referenced here, not the full 12-step scale.
 */

import { step9 as tomatoBg } from '@lib/design/color/tomato/light';
import { contrast as tomatoContrast } from '@lib/design/color/tomato/contrast';
import { step9 as redBg } from '@lib/design/color/red/light';
import { contrast as redContrast } from '@lib/design/color/red/contrast';
import { step9 as rubyBg } from '@lib/design/color/ruby/light';
import { contrast as rubyContrast } from '@lib/design/color/ruby/contrast';
import { step9 as crimsonBg } from '@lib/design/color/crimson/light';
import { contrast as crimsonContrast } from '@lib/design/color/crimson/contrast';
import { step9 as pinkBg } from '@lib/design/color/pink/light';
import { contrast as pinkContrast } from '@lib/design/color/pink/contrast';
import { step9 as plumBg } from '@lib/design/color/plum/light';
import { contrast as plumContrast } from '@lib/design/color/plum/contrast';
import { step9 as purpleBg } from '@lib/design/color/purple/light';
import { contrast as purpleContrast } from '@lib/design/color/purple/contrast';
import { step9 as violetBg } from '@lib/design/color/violet/light';
import { contrast as violetContrast } from '@lib/design/color/violet/contrast';
import { step9 as irisBg } from '@lib/design/color/iris/light';
import { contrast as irisContrast } from '@lib/design/color/iris/contrast';
import { step9 as indigoBg } from '@lib/design/color/indigo/light';
import { contrast as indigoContrast } from '@lib/design/color/indigo/contrast';
import { step9 as blueBg } from '@lib/design/color/blue/light';
import { contrast as blueContrast } from '@lib/design/color/blue/contrast';
import { step9 as cyanBg } from '@lib/design/color/cyan/light';
import { contrast as cyanContrast } from '@lib/design/color/cyan/contrast';
import { step9 as skyBg } from '@lib/design/color/sky/light';
import { contrast as skyContrast } from '@lib/design/color/sky/contrast';
import { step9 as tealBg } from '@lib/design/color/teal/light';
import { contrast as tealContrast } from '@lib/design/color/teal/contrast';
import { step9 as jadeBg } from '@lib/design/color/jade/light';
import { contrast as jadeContrast } from '@lib/design/color/jade/contrast';
import { step9 as mintBg } from '@lib/design/color/mint/light';
import { contrast as mintContrast } from '@lib/design/color/mint/contrast';
import { step9 as greenBg } from '@lib/design/color/green/light';
import { contrast as greenContrast } from '@lib/design/color/green/contrast';
import { step9 as grassBg } from '@lib/design/color/grass/light';
import { contrast as grassContrast } from '@lib/design/color/grass/contrast';
import { step9 as limeBg } from '@lib/design/color/lime/light';
import { contrast as limeContrast } from '@lib/design/color/lime/contrast';
import { step9 as yellowBg } from '@lib/design/color/yellow/light';
import { contrast as yellowContrast } from '@lib/design/color/yellow/contrast';
import { step9 as amberBg } from '@lib/design/color/amber/light';
import { contrast as amberContrast } from '@lib/design/color/amber/contrast';
import { step9 as orangeBg } from '@lib/design/color/orange/light';
import { contrast as orangeContrast } from '@lib/design/color/orange/contrast';
import { step9 as goldBg } from '@lib/design/color/gold/light';
import { contrast as goldContrast } from '@lib/design/color/gold/contrast';
import { step9 as bronzeBg } from '@lib/design/color/bronze/light';
import { contrast as bronzeContrast } from '@lib/design/color/bronze/contrast';
import { step9 as brownBg } from '@lib/design/color/brown/light';
import { contrast as brownContrast } from '@lib/design/color/brown/contrast';

/** Resolve `'white'` to its hex equivalent so the SVG ships valid `#rrggbb`. */
const normalize = (value: string): string =>
  value.toLowerCase() === 'white' ? '#ffffff' : value.toLowerCase();

/** A named primary palette pinned to its background + contrast pair. */
export interface PaletteOption {
  /** Stable identifier used for URL serialization and footer display. */
  name: string;
  /** Background fill — Radix `solid[9]` from the light scale. */
  bg: string;
  /** Legible foreground paired with `bg` — Radix `contrast`. */
  fg: string;
}

/** Curated set of chromatic palettes. Order is hue-walk, not alphabetic. */
export const PALETTES: ReadonlyArray<PaletteOption> = [
  { name: 'tomato', bg: tomatoBg, fg: normalize(tomatoContrast) },
  { name: 'red', bg: redBg, fg: normalize(redContrast) },
  { name: 'ruby', bg: rubyBg, fg: normalize(rubyContrast) },
  { name: 'crimson', bg: crimsonBg, fg: normalize(crimsonContrast) },
  { name: 'pink', bg: pinkBg, fg: normalize(pinkContrast) },
  { name: 'plum', bg: plumBg, fg: normalize(plumContrast) },
  { name: 'purple', bg: purpleBg, fg: normalize(purpleContrast) },
  { name: 'violet', bg: violetBg, fg: normalize(violetContrast) },
  { name: 'iris', bg: irisBg, fg: normalize(irisContrast) },
  { name: 'indigo', bg: indigoBg, fg: normalize(indigoContrast) },
  { name: 'blue', bg: blueBg, fg: normalize(blueContrast) },
  { name: 'cyan', bg: cyanBg, fg: normalize(cyanContrast) },
  { name: 'sky', bg: skyBg, fg: normalize(skyContrast) },
  { name: 'teal', bg: tealBg, fg: normalize(tealContrast) },
  { name: 'jade', bg: jadeBg, fg: normalize(jadeContrast) },
  { name: 'mint', bg: mintBg, fg: normalize(mintContrast) },
  { name: 'green', bg: greenBg, fg: normalize(greenContrast) },
  { name: 'grass', bg: grassBg, fg: normalize(grassContrast) },
  { name: 'lime', bg: limeBg, fg: normalize(limeContrast) },
  { name: 'yellow', bg: yellowBg, fg: normalize(yellowContrast) },
  { name: 'amber', bg: amberBg, fg: normalize(amberContrast) },
  { name: 'orange', bg: orangeBg, fg: normalize(orangeContrast) },
  { name: 'gold', bg: goldBg, fg: normalize(goldContrast) },
  { name: 'bronze', bg: bronzeBg, fg: normalize(bronzeContrast) },
  { name: 'brown', bg: brownBg, fg: normalize(brownContrast) },
];

/** Identifier union for the palette set. */
export type PaletteName = (typeof PALETTES)[number]['name'];

const PALETTE_BY_NAME = new Map(PALETTES.map((entry) => [entry.name, entry]));

/** Look up a palette by name. Returns `undefined` for unknown names. */
export const findPalette = (name: string): PaletteOption | undefined =>
  PALETTE_BY_NAME.get(name);
