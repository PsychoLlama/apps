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

// No explicit `display` — the underlying tag's default applies, so an
// inline span keeps mid-line text wrapping (with `box-decoration-break:
// clone` so the bg-box repaints across line breaks) and a block tag
// hosts block children naturally. `:empty` falls back to a sized block
// for standalone placeholders.
//
// `line-height` is left alone so wrapping a whole sentence doesn't
// collapse the placeholder height — Radix only zeros line-height
// inside its inline-skeleton branch (text wrapped mid-line), which
// our single styling path can't tell apart.
export const base = style({
  borderRadius: radius[1],
  animation: `${pulse} ${slow[2]} ${standard.productive} infinite alternate`,
  color: 'transparent',
  pointerEvents: 'none',
  userSelect: 'none',
  cursor: 'default',
  boxDecorationBreak: 'clone',
  // Standalone skeletons (no children) need an intrinsic size since
  // there's no content to derive one from. Consumers override via
  // `style={{ width, height }}`.
  selectors: {
    '&:where(:empty)': {
      display: 'block',
      /* eslint-disable-next-line custom/require-design-tokens */
      minHeight: '1em',
    },
  },
});

// Hide painted content so children only contribute layout.
globalStyle(`${base} > *, ${base}::before, ${base}::after`, {
  visibility: 'hidden',
});
