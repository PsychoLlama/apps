import { lightDark } from '@lib/design/color-scheme';
import { blueDark, blueLight } from '@lib/design/color/blue';
import { brownDark, brownLight } from '@lib/design/color/brown';
import { cyanDark, cyanLight } from '@lib/design/color/cyan';
import { indigoDark, indigoLight } from '@lib/design/color/indigo';
import { irisDark, irisLight } from '@lib/design/color/iris';
import { jadeDark, jadeLight } from '@lib/design/color/jade';
import { orangeDark, orangeLight } from '@lib/design/color/orange';
import { pinkDark, pinkLight } from '@lib/design/color/pink';
import { plumDark, plumLight } from '@lib/design/color/plum';
import { purpleDark, purpleLight } from '@lib/design/color/purple';
import { skyDark, skyLight } from '@lib/design/color/sky';
import { tealDark, tealLight } from '@lib/design/color/teal';
import { violetDark, violetLight } from '@lib/design/color/violet';
import type { ThemeId } from './catalog';

/**
 * Per-theme accent swatch (Radix scale `9`), pre-wrapped in
 * `light-dark(...)`. Drop directly into a Vanilla Extract style value.
 *
 * Lives in a `.css.ts` sibling of the catalog so palette imports stay
 * compile-time only — `.css.ts` callers (e.g. `styleVariants(swatch,
 * ...)`) reach this directly without dragging the runtime catalog or
 * its `?css-asset` imports through Vanilla Extract's vite-node
 * compiler, which doesn't load the `css-asset` plugin.
 */
export const swatch: Record<ThemeId, string> = {
  blue: lightDark(blueLight[9], blueDark[9]),
  brown: lightDark(brownLight[9], brownDark[9]),
  cyan: lightDark(cyanLight[9], cyanDark[9]),
  indigo: lightDark(indigoLight[9], indigoDark[9]),
  iris: lightDark(irisLight[9], irisDark[9]),
  jade: lightDark(jadeLight[9], jadeDark[9]),
  orange: lightDark(orangeLight[9], orangeDark[9]),
  pink: lightDark(pinkLight[9], pinkDark[9]),
  plum: lightDark(plumLight[9], plumDark[9]),
  purple: lightDark(purpleLight[9], purpleDark[9]),
  sky: lightDark(skyLight[9], skyDark[9]),
  teal: lightDark(tealLight[9], tealDark[9]),
  violet: lightDark(violetLight[9], violetDark[9]),
};
