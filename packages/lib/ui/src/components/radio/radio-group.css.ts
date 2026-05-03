/**
 * RadioGroup layout styles.
 *
 * Ported from Radix UI Themes RadioGroup. The radio itself reuses
 * the styles in `./radio.css`; these rules govern only the column
 * stack at the root and the inline label layout each item renders
 * when `children` are provided.
 *
 * @see https://www.radix-ui.com/themes/docs/components/radio-group
 */

import { style } from '@vanilla-extract/css';
import { space } from '@lib/design';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: space[1],
});

export const item = style({
  display: 'flex',
  alignItems: 'center',
  gap: space[2],
  // Trim the click target to the label's own width so whitespace to
  // the right of the text is not clickable.
  width: 'fit-content',
});

export const itemInner = style({
  // Allow text truncation inside the label content.
  minWidth: 0,
});
