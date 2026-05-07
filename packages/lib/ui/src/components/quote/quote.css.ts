/**
 * Quote styles.
 *
 * Ported from Radix UI Themes Quote. Deviations:
 * - No `--quote-font-family` / `--quote-font-size-adjust` /
 *   `--quote-font-style` / `--quote-font-weight` theming vars.
 *   Single body font, no font-size-adjust mechanism, so the italic
 *   treatment inherits metrics from the surrounding text.
 * - Drop upstream's `font-size: calc(var(--quote-font-size-adjust) *
 *   1em)` and the `& :where(&) { font-size: inherit }` guard — both
 *   pair with the font-size-adjust trick we don't apply.
 * - The browser auto-inserts smart quotes around `<q>` via the
 *   `quotes` UA stylesheet; we keep that default rather than
 *   overriding it.
 *
 * @see https://www.radix-ui.com/themes/docs/components/quote
 */

import { fallbackVar, style } from '@vanilla-extract/css';
import { letterSpacingOffset } from '@lib/design';
import { letterSpacing } from '../../vars/typography.css';

/* eslint-disable custom/require-design-tokens -- italic-tightening offsets and the 1.25 line-height multiplier mirror Radix's per-style typography knobs */
export const base = style({
  fontStyle: 'italic',
  lineHeight: 1.25,
  // Compose the italic tracking nudge with the surrounding tracking so a
  // `<Quote>` inside `<Text size={7}>` lands at
  // `letterSpacingOffset.quote + typeScale[7].letterSpacing`.
  letterSpacing: `calc(${letterSpacingOffset.quote} + ${fallbackVar(letterSpacing, '0em')})`,
});
/* eslint-enable custom/require-design-tokens */
