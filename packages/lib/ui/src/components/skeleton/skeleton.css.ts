/**
 * Skeleton styles.
 *
 * Ported from Radix UI Themes Skeleton. Deviations:
 * - Pulse duration uses the `slow[2]` motion token; honors
 *   `prefers-reduced-motion` automatically.
 * - One styling path: there's no `data-inline-skeleton` branch because
 *   the component always renders its own wrapper <span>.
 * - Inherits the ambient font instead of pinning to Arial. Inline text
 *   placeholders measure with the same metrics as the eventual text,
 *   so the swap doesn't shift surrounding layout.
 *
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/skeleton.css
 */

import { globalStyle, keyframes, style } from '@vanilla-extract/css';
import { neutral, radius, slow, standard } from '@lib/design';

const pulse = keyframes({
  from: { backgroundColor: neutral.alpha[3] },
  to: { backgroundColor: neutral.alpha[4] },
});

// `inline-block` accommodates both standalone (sized) placeholders and
// children that bring their own dimensions (e.g. inline icons). For
// text wrapping the bg-box fits the glyphs because `line-height: 0`
// collapses the surrounding leading.
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
  // Standalone skeletons (no children) need an intrinsic size since
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
