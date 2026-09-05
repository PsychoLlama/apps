import { style, styleVariants } from '@vanilla-extract/css';
import { radius } from '@lib/design';

/**
 * The visual surface. Sizes to its content so a window hugs what it
 * holds instead of wrapping or stretching to fill the positioned box.
 *
 * Takes pointer events back from the window, which passes them through
 * (see `window.css`). The surface is the only part of a floating window
 * that should catch a click.
 */
export const body = style({
  width: 'max-content',
  height: 'max-content',
  pointerEvents: 'auto',
});

/** Per-step border radius for the surface, keyed by the design scale. */
export const bodyRadius = styleVariants(radius, (value) => ({
  borderRadius: value,
}));
