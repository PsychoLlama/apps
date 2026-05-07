/**
 * Quote styles.
 *
 * Ported from Radix UI Themes Quote. Deviations:
 * - Reads `fontFamily.quote` (Times New Roman serif) directly instead
 *   of a `--quote-font-family` Theme knob — we expose the family as a
 *   design token.
 * - Browsers auto-insert smart quotes around `<q>` via the `quotes` UA
 *   stylesheet; we keep that default rather than overriding it.
 *
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/quote.css
 */

import { fallbackVar, style } from '@vanilla-extract/css';
import { fontFamily, fontSizeAdjust, letterSpacingOffset } from '@lib/design';
import { letterSpacing } from '../../vars/typography.css';

/* eslint-disable custom/require-design-tokens -- the 1em scaler, italic-tightening offset, and 1.25 line-height mirror Radix's per-style typography knobs */
export const base = style({
  fontFamily: fontFamily.quote,
  // Times italic looks ~18% smaller than the body sans at the same
  // declared font-size; bump it back up. Mirrors Radix's
  // `font-size: calc(var(--quote-font-size-adjust) * 1em)`.
  fontSize: `calc(${fontSizeAdjust.quote} * 1em)`,
  fontStyle: 'italic',
  lineHeight: 1.25,
  // Compose the italic tracking nudge with the surrounding tracking so a
  // `<Quote>` inside `<Text size={7}>` lands at
  // `letterSpacingOffset.quote + typeScale[7].letterSpacing`.
  letterSpacing: `calc(${letterSpacingOffset.quote} + ${fallbackVar(letterSpacing, '0em')})`,
  selectors: {
    // Don't compound the scale on nested `<q>`. Mirrors Radix's
    // `& :where(&) { font-size: inherit }`.
    '& :where(&)': { fontSize: 'inherit' },
  },
});
/* eslint-enable custom/require-design-tokens */
