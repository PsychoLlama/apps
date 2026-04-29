/**
 * Skeleton overlay class.
 *
 * Adapted from Radix UI Themes Skeleton CSS. Applied as a class on top
 * of an existing component, so the visuals (background, border, shadow,
 * color) need to win over the host's own variants. Wrapped in a
 * compound `&&` selector to bump specificity to 0,2,0 — beats any
 * single-class component variant via the cascade alone, no
 * `!important` required.
 *
 * Note: an `!important` background-color (or shorthand `background`)
 * would block the keyframe animation from interpolating the pulse,
 * since CSS animations don't override `!important` declarations.
 *
 * Trade-off: consumer-supplied inline `style` props (which carry
 * 1,0,0,0 specificity) beat this class. Don't ship background or
 * color overrides via inline style on a skeletonized element — pass
 * a class or skip the skeleton.
 *
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/skeleton.css
 */

import { globalStyle, keyframes, style } from '@vanilla-extract/css';
import { neutral, slow, standard } from '@lib/design';

const pulse = keyframes({
  from: { backgroundColor: neutral.alpha[3] },
  to: { backgroundColor: neutral.alpha[4] },
});

// `background: none`, `boxShadow: none`, `color: transparent` are
// deliberate cascade overrides, not design intent. The animation
// supplies the pulsing background-color.
/* eslint-disable custom/require-design-tokens */
export const skeleton = style({
  selectors: {
    '&&': {
      // `border-radius` is intentionally left untouched so each host
      // component's own corner shape (pill badge, large card, etc.)
      // shows through the placeholder.
      animation: `${pulse} ${slow[2]} ${standard.productive} infinite alternate`,
      background: 'none',
      border: 'none',
      boxShadow: 'none',
      color: 'transparent',
      cursor: 'default',
      pointerEvents: 'none',
      userSelect: 'none',
      // Repaints the bg-box across line breaks for inline text wrappers.
      boxDecorationBreak: 'clone',
    },
  },
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
// skeleton is on. Compound class for 0,2,1 specificity to beat
// single-class component variants like `.card-variant-surface::after`.
globalStyle(
  `.${skeleton}.${skeleton}::before, .${skeleton}.${skeleton}::after`,
  {
    background: 'none',
    backgroundImage: 'none',
    border: 'none',
    boxShadow: 'none',
  },
);
