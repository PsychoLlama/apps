import { createVar, style } from '@vanilla-extract/css';

/**
 * Border radius of the surface. Assigned by the window from its `radius`
 * prop and inherited down to the body, so the one value also seats the
 * arrow clear of the rounded corner. The window defaults it to square.
 */
export const borderRadius = createVar();

/**
 * Whether the surface catches the pointer. The root defaults it to
 * `auto`, at zero specificity, so a component overrides it anywhere
 * from the root down; `none` lets presses and hover through to the
 * page beneath. No fallback: a body outside a root inherits instead.
 */
export const pointerEvents = createVar();

/**
 * The visual surface. Sizes to its content so a window hugs what it
 * holds instead of wrapping or stretching to fill the positioned box.
 *
 * Takes pointer events back from the window, which passes them through
 * (see `window.css`), as {@link pointerEvents} says to.
 */
export const body = style({
  width: 'max-content',
  height: 'max-content',
  borderRadius,
  pointerEvents,
});
