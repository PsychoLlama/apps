/**
 * Quote styles.
 *
 * Ported from Radix UI Themes Quote. Deviations:
 * - No `--quote-font-family` / `--quote-font-size-adjust` /
 *   `--quote-font-style` / `--quote-font-weight` / `--quote-letter-spacing`
 *   theming vars. Single body font, no font-size-adjust mechanism, so
 *   the italic treatment inherits metrics from the surrounding text.
 * - Drop upstream's `font-size: calc(var(--quote-font-size-adjust) *
 *   1em)` and the `& :where(&) { font-size: inherit }` guard — both
 *   pair with the font-size-adjust trick we don't apply.
 * - The browser auto-inserts smart quotes around `<q>` via the
 *   `quotes` UA stylesheet; we keep that default rather than
 *   overriding it.
 *
 * @see https://www.radix-ui.com/themes/docs/components/quote
 */

import { style } from '@vanilla-extract/css';

export const base = style({
  fontStyle: 'italic',
});
