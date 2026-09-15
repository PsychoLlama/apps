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
 * An interactive surface takes pointer events back from the window,
 * which passes them through (see `window.css`); it's the only part of a
 * floating window that should catch a click. A non-interactive one
 * inherits the window's `none`, so the pointer goes straight through to
 * the page underneath.
 */
export const body = style({
  width: 'max-content',
  height: 'max-content',
  borderRadius: fallbackVar(borderRadius, '0px'),
  selectors: {
    '&:where([data-interactive="true"])': {
      pointerEvents: 'auto',
    },
  },
});
