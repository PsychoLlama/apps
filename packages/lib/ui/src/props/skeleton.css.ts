/**
 * Skeleton overlay class.
 *
 * Adapted from Radix UI Themes Skeleton CSS. Applied as a class on top
 * of an existing component, so the visuals (background, border, shadow,
 * color) need to win not just over the host's own variants but also
 * over consumer-supplied inline `style` props — which beat any
 * selector specificity. `!important` is the only mechanism that does
 * that, so the visual overrides carry it.
 *
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/skeleton.css
 */

import { globalStyle, keyframes, style } from '@vanilla-extract/css';
import { neutral, slow, standard } from '@lib/design';

const pulse = keyframes({
  from: { backgroundColor: neutral.alpha[3] },
  to: { backgroundColor: neutral.alpha[4] },
});

// `boxShadow: none` and `color: transparent` are deliberate overrides
// (not design intent), so the design-token rule doesn't apply here.
/* eslint-disable custom/require-design-tokens */
export const skeleton = style({
  // `border-radius` is intentionally left untouched so each host
  // component's own corner shape (pill badge, large card, etc.) shows
  // through the placeholder.
  animation: `${pulse} ${slow[2]} ${standard.productive} infinite alternate !important`,
  background: 'none !important',
  backgroundColor: `${neutral.alpha[3]} !important`,
  border: 'none !important',
  boxShadow: 'none !important',
  color: 'transparent !important',
  cursor: 'default !important',
  pointerEvents: 'none',
  userSelect: 'none',
  // Repaints the bg-box across line breaks for inline text wrappers.
  boxDecorationBreak: 'clone',
});
/* eslint-enable custom/require-design-tokens */

// Direct children only contribute layout, not paint.
globalStyle(`.${skeleton} > *`, {
  visibility: 'hidden',
});

// Suppress painted styles on the host's own pseudo-elements (e.g. Card's
// `::after` border) without using `visibility: hidden` — the trim helper
// uses `::before`/`::after` with negative margins to remove leading
// whitespace, and that geometry needs to keep applying while the
// skeleton is on.
globalStyle(`.${skeleton}::before, .${skeleton}::after`, {
  background: 'none',
  backgroundImage: 'none',
  border: 'none',
  boxShadow: 'none',
});
