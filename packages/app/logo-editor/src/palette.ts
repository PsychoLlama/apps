/**
 * Curated logo-editor palette set sampled from Radix's primary hues.
 * Each entry pairs a `bg` (light scale step 9) with a `fg` (the
 * palette's `contrast` value, typically white but darker for
 * high-luminance hues like yellow or sky). Shipped as raw hex so the
 * SVG export stays portable across consumers' color schemes.
 */

import { amberLight, amberContrast } from '@lib/design/palette-raw/amber';
import { blueLight, blueContrast } from '@lib/design/palette-raw/blue';
import { bronzeLight, bronzeContrast } from '@lib/design/palette-raw/bronze';
import { brownLight, brownContrast } from '@lib/design/palette-raw/brown';
import { crimsonLight, crimsonContrast } from '@lib/design/palette-raw/crimson';
import { cyanLight, cyanContrast } from '@lib/design/palette-raw/cyan';
import { goldLight, goldContrast } from '@lib/design/palette-raw/gold';
import { grassLight, grassContrast } from '@lib/design/palette-raw/grass';
import { greenLight, greenContrast } from '@lib/design/palette-raw/green';
import { indigoLight, indigoContrast } from '@lib/design/palette-raw/indigo';
import { irisLight, irisContrast } from '@lib/design/palette-raw/iris';
import { jadeLight, jadeContrast } from '@lib/design/palette-raw/jade';
import { limeLight, limeContrast } from '@lib/design/palette-raw/lime';
import { mintLight, mintContrast } from '@lib/design/palette-raw/mint';
import { orangeLight, orangeContrast } from '@lib/design/palette-raw/orange';
import { pinkLight, pinkContrast } from '@lib/design/palette-raw/pink';
import { plumLight, plumContrast } from '@lib/design/palette-raw/plum';
import { purpleLight, purpleContrast } from '@lib/design/palette-raw/purple';
import { redLight, redContrast } from '@lib/design/palette-raw/red';
import { rubyLight, rubyContrast } from '@lib/design/palette-raw/ruby';
import { skyLight, skyContrast } from '@lib/design/palette-raw/sky';
import { tealLight, tealContrast } from '@lib/design/palette-raw/teal';
import { tomatoLight, tomatoContrast } from '@lib/design/palette-raw/tomato';
import { violetLight, violetContrast } from '@lib/design/palette-raw/violet';
import { yellowLight, yellowContrast } from '@lib/design/palette-raw/yellow';

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
  { name: 'tomato', bg: tomatoLight[9], fg: normalize(tomatoContrast) },
  { name: 'red', bg: redLight[9], fg: normalize(redContrast) },
  { name: 'ruby', bg: rubyLight[9], fg: normalize(rubyContrast) },
  { name: 'crimson', bg: crimsonLight[9], fg: normalize(crimsonContrast) },
  { name: 'pink', bg: pinkLight[9], fg: normalize(pinkContrast) },
  { name: 'plum', bg: plumLight[9], fg: normalize(plumContrast) },
  { name: 'purple', bg: purpleLight[9], fg: normalize(purpleContrast) },
  { name: 'violet', bg: violetLight[9], fg: normalize(violetContrast) },
  { name: 'iris', bg: irisLight[9], fg: normalize(irisContrast) },
  { name: 'indigo', bg: indigoLight[9], fg: normalize(indigoContrast) },
  { name: 'blue', bg: blueLight[9], fg: normalize(blueContrast) },
  { name: 'cyan', bg: cyanLight[9], fg: normalize(cyanContrast) },
  { name: 'sky', bg: skyLight[9], fg: normalize(skyContrast) },
  { name: 'teal', bg: tealLight[9], fg: normalize(tealContrast) },
  { name: 'jade', bg: jadeLight[9], fg: normalize(jadeContrast) },
  { name: 'mint', bg: mintLight[9], fg: normalize(mintContrast) },
  { name: 'green', bg: greenLight[9], fg: normalize(greenContrast) },
  { name: 'grass', bg: grassLight[9], fg: normalize(grassContrast) },
  { name: 'lime', bg: limeLight[9], fg: normalize(limeContrast) },
  { name: 'yellow', bg: yellowLight[9], fg: normalize(yellowContrast) },
  { name: 'amber', bg: amberLight[9], fg: normalize(amberContrast) },
  { name: 'orange', bg: orangeLight[9], fg: normalize(orangeContrast) },
  { name: 'gold', bg: goldLight[9], fg: normalize(goldContrast) },
  { name: 'bronze', bg: bronzeLight[9], fg: normalize(bronzeContrast) },
  { name: 'brown', bg: brownLight[9], fg: normalize(brownContrast) },
];

/** Identifier union for the palette set. */
export type PaletteName = (typeof PALETTES)[number]['name'];

const PALETTE_BY_NAME = new Map(PALETTES.map((entry) => [entry.name, entry]));

/** Look up a palette by name. Returns `undefined` for unknown names. */
export const findPalette = (name: string): PaletteOption | undefined =>
  PALETTE_BY_NAME.get(name);
