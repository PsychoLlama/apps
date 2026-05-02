/**
 * Strong styles.
 *
 * Ported from Radix UI Themes Strong. Deviations:
 * - No `--strong-font-family` / `--strong-font-size-adjust` /
 *   `--strong-font-style` / `--strong-font-weight` / `--strong-letter-spacing`
 *   theming vars. Single body font, no font-size-adjust mechanism.
 * - The `& :where(&) { font-size: inherit }` guard is unnecessary
 *   without font-size-adjust — nested `<strong>` doesn't compound.
 *
 * @see https://www.radix-ui.com/themes/docs/components/strong
 */

import { style } from '@vanilla-extract/css';
import { fontWeight } from '@lib/design';

export const base = style({
  fontWeight: fontWeight.bold,
});
