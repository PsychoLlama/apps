/**
 * Em styles.
 *
 * Ported from Radix UI Themes Em. Deviations:
 * - No `--em-font-family` / `--em-font-size-adjust` / `--em-font-style` /
 *   `--em-font-weight` / `--em-letter-spacing` theming vars. We have a
 *   single font family and no font-size-adjust mechanism, so italics
 *   inherit metrics from the surrounding text.
 * - The `& :where(&) { font-size: inherit }` guard is unnecessary
 *   without font-size-adjust — nested `<em>` doesn't compound.
 * - Drop upstream's `line-height: 1.25`, `box-sizing: border-box`, and
 *   `color: inherit`. The line-height clamp pairs with font-size-adjust
 *   (which we don't apply); the other two are no-ops on inline `<em>`.
 *
 * @see https://www.radix-ui.com/themes/docs/components/em
 */

import { style } from '@vanilla-extract/css';

export const base = style({
  fontStyle: 'italic',
});
