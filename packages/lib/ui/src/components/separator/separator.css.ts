/**
 * Separator styles.
 *
 * Ported from Radix UI Themes Separator. Deviations:
 * - `color` is restricted to `accent` and `neutral`.
 * - `size` is a static class, not a responsive `data-*` cascade.
 * - Orientation hands its size off via a `createVar()` shared with `size`,
 *   instead of duplicating the matrix per orientation.
 *
 * @see https://www.radix-ui.com/themes/docs/components/separator
 */

import { createVar, style, styleVariants } from '@vanilla-extract/css';
import { accent, neutral, space } from '@lib/design';

const separatorColor = createVar();
const separatorSize = createVar();

export const base = style({
  display: 'block',
  flexShrink: 0,
  backgroundColor: separatorColor,
});

export const orientation = styleVariants({
  horizontal: {
    width: separatorSize,
    height: '1px',
  },
  vertical: {
    width: '1px',
    height: separatorSize,
  },
});

export const size = styleVariants({
  1: { vars: { [separatorSize]: space[4] } },
  2: { vars: { [separatorSize]: space[6] } },
  3: { vars: { [separatorSize]: space[9] } },
  4: { vars: { [separatorSize]: '100%' } },
});

export const color = styleVariants({
  accent: { vars: { [separatorColor]: accent.alpha[6] } },
  neutral: { vars: { [separatorColor]: neutral.alpha[6] } },
});
