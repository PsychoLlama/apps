/**
 * Section styles.
 *
 * Ported from Radix UI Themes Section. Deviations:
 * - Sizes 1–3 align to existing `space` tokens (5 / 7 / 9). Size 4 has
 *   no matching token (Radix uses `calc(80px * var(--scaling))`); we
 *   pin it to `5rem` directly.
 * - No `display` prop.
 *
 * @see https://www.radix-ui.com/themes/docs/components/section
 */

import { style, styleVariants } from '@vanilla-extract/css';
import { space } from '@lib/design';

export const base = style({
  boxSizing: 'border-box',
  flexShrink: 0,
});

export const size = styleVariants({
  1: { paddingTop: space[5], paddingBottom: space[5] },
  2: { paddingTop: space[7], paddingBottom: space[7] },
  3: { paddingTop: space[9], paddingBottom: space[9] },
  4: {
    // eslint-disable-next-line custom/require-design-tokens -- size 4 sits above the `space` scale; matches Radix's 80px stop.
    paddingTop: '5rem',
    // eslint-disable-next-line custom/require-design-tokens -- size 4 sits above the `space` scale; matches Radix's 80px stop.
    paddingBottom: '5rem',
  },
});
