/**
 * Separator styles.
 *
 * Ported from Radix UI Themes Separator. Deviations:
 * - `size` is a static class, not a responsive `data-*` cascade.
 * - Adds `flex-shrink: 0` so the separator keeps its target size in flex
 *   parents. Matches the rest of `@lib/ui` (Badge, Kbd) but isn't in the
 *   upstream rule.
 *
 * @see https://www.radix-ui.com/themes/docs/components/separator
 */

import { style, styleVariants } from '@vanilla-extract/css';
import { accent, danger, neutral, space, success, warning } from '@lib/design';

export const base = style({
  display: 'block',
  flexShrink: 0,
});

export const orientation = styleVariants({
  horizontal: { height: '1px' },
  vertical: { width: '1px' },
});

const horizontalSize = styleVariants({
  1: { width: space[4] },
  2: { width: space[6] },
  3: { width: space[9] },
  4: { width: '100%' },
});

const verticalSize = styleVariants({
  1: { height: space[4] },
  2: { height: space[6] },
  3: { height: space[9] },
  4: { height: '100%' },
});

export const size = {
  horizontal: horizontalSize,
  vertical: verticalSize,
} as const;

export const color = styleVariants({
  accent: { backgroundColor: accent.alpha[6] },
  neutral: { backgroundColor: neutral.alpha[6] },
  danger: { backgroundColor: danger.alpha[6] },
  warning: { backgroundColor: warning.alpha[6] },
  success: { backgroundColor: success.alpha[6] },
});
