/**
 * Skeleton styles.
 *
 * Ported from Radix UI Themes Skeleton. Deviations:
 * - Pulse duration uses the `slow[2]` motion token; honors
 *   `prefers-reduced-motion` automatically.
 * - One styling path: there's no `data-inline-skeleton` branch because
 *   the component always renders its own wrapper <span>.
 *
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/skeleton.css
 */

import { globalStyle, keyframes, style } from '@vanilla-extract/css';
import { neutral, radius, slow, standard } from '@lib/design';

const pulse = keyframes({
  from: { backgroundColor: neutral.alpha[3] },
  to: { backgroundColor: neutral.alpha[4] },
});

// Stable bg-box height when wrapping inline text — strip line-height
// and pin the fallback font to Arial so the placeholder doesn't grow
// with the ambient font's ascent/descent. Radix's Skeleton does the
// same; they're escape hatches, not theme tokens.
/* eslint-disable custom/require-design-tokens */
export const base = style({
  display: 'inline-block',
  borderRadius: radius[1],
  animation: `${pulse} ${slow[2]} ${standard.productive} infinite alternate`,
  color: 'transparent',
  pointerEvents: 'none',
  userSelect: 'none',
  cursor: 'default',
  lineHeight: 0,
  fontFamily: 'Arial, sans-serif',
  // Standalone skeletons (no children) need an intrinsic height since
  // there's no content to derive one from. Consumers override via
  // `style={{ width, height }}`.
  selectors: {
    '&:where(:empty)': {
      display: 'block',
      minHeight: '1em',
    },
  },
});
/* eslint-enable custom/require-design-tokens */

// Hide painted content so children only contribute layout.
globalStyle(`${base} > *, ${base}::before, ${base}::after`, {
  visibility: 'hidden',
});
