import { style, styleVariants } from '@vanilla-extract/css';
import { radius } from '@lib/design';

/**
 * The visual surface. Sizes to its content so a window hugs what it
 * holds instead of wrapping or stretching to fill the positioned box.
 */
export const body = style({
  width: 'max-content',
  height: 'max-content',
});

/** Per-step border radius for the surface, keyed by the design scale. */
export const bodyRadius = styleVariants(radius, (value) => ({
  borderRadius: value,
}));
