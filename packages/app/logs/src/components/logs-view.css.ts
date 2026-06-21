import { style } from '@vanilla-extract/css';
import { background, space } from '@lib/design';

/**
 * The logs `<main>` frame, pinned to the viewport via `inset: 0` so it owns a
 * definite height to split between the header and the scrolling content below.
 * Mirrors `@lib/shell`'s `Frame` — see its `frame.css.ts` for why a flex chain
 * off the body alone can't contain the scroll here.
 */
export const layout = style({
  position: 'absolute',
  inset: 0,
});

/**
 * The scrolling content region beneath the header. Owns its own vertical
 * scroll (`min-height: 0` lets it shrink past its content) and paints the page
 * background so the scrollport stays opaque and composited.
 */
export const content = style({
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: space[5],
  backgroundColor: background.page,
});
