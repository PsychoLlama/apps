/**
 * Skeleton overlay class.
 *
 * Adapted from Radix UI Themes Skeleton CSS. Applied as a class on top
 * of an existing component, so the visuals (background, border, shadow,
 * color) need to win over the host's own variants regardless of
 * stylesheet load order. Wrapped in a compound `&&` selector to bump
 * specificity to 0,2,0 — beats single-class component variants without
 * reaching for `!important`.
 *
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/skeleton.css
 */

import { globalStyle, keyframes, style } from '@vanilla-extract/css';
import { neutral, slow, standard } from '@lib/design';

const pulse = keyframes({
  from: { backgroundColor: neutral.alpha[3] },
  to: { backgroundColor: neutral.alpha[4] },
});

export const skeleton = style({
  selectors: {
    '&&': {
      // `border-radius` is intentionally left untouched so each host
      // component's own corner shape (pill badge, large card, etc.)
      // shows through the placeholder.
      animation: `${pulse} ${slow[2]} ${standard.productive} infinite alternate`,
      background: 'none',
      backgroundColor: neutral.alpha[3],
      border: 'none',
      boxShadow: 'none',
      color: 'transparent',
      pointerEvents: 'none',
      userSelect: 'none',
      cursor: 'default',
      // Repaints the bg-box across line breaks for inline text wrappers.
      boxDecorationBreak: 'clone',
    },
  },
});

// Painted child content stays invisible so children only contribute layout.
globalStyle(`.${skeleton} > *, .${skeleton}::before, .${skeleton}::after`, {
  visibility: 'hidden',
});
