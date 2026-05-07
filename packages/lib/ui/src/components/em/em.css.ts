/**
 * Em styles.
 *
 * Ported from Radix UI Themes Em. Deviations:
 * - The italic flavor reads `fontFamily.em` (Times New Roman serif)
 *   instead of a per-element themable `--em-font-family` knob — we
 *   expose the family as a design token rather than a Theme prop.
 * - No `box-sizing: border-box` / `color: inherit` carry-overs from
 *   upstream — both no-ops on inline `<em>` once the global reset is
 *   applied.
 *
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/em.css
 */

import { style } from '@vanilla-extract/css';
import { fontFamily, fontSizeAdjust } from '@lib/design';

/* eslint-disable custom/require-design-tokens -- the 1em scaler and 1.25 line-height mirror Radix's per-style typography knobs */
export const base = style({
  fontFamily: fontFamily.em,
  // Times italic looks ~18% smaller than the body sans at the same
  // declared font-size; bump it back up. Mirrors Radix's
  // `font-size: calc(var(--em-font-size-adjust) * 1em)`.
  fontSize: `calc(${fontSizeAdjust.em} * 1em)`,
  fontStyle: 'italic',
  lineHeight: 1.25,
  selectors: {
    // Don't compound the scale on nested `<em>` — once is enough.
    // Mirrors Radix's `& :where(&) { font-size: inherit }`.
    '& :where(&)': { fontSize: 'inherit' },
  },
});
/* eslint-enable custom/require-design-tokens */
