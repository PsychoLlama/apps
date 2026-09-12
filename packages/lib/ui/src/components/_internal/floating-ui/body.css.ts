import { createVar, fallbackVar, style } from '@vanilla-extract/css';

/**
 * Border radius of the surface. Assigned by the window from its `radius`
 * prop and inherited down to the body, so the one value also seats the
 * arrow clear of the rounded corner. Unset falls back to square.
 */
export const borderRadius = createVar();

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
  borderRadius: fallbackVar(borderRadius, '0px'),
});
