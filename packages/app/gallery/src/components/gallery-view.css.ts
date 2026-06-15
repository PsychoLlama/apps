import { createVar, style } from '@vanilla-extract/css';
import { background, space } from '@lib/design';

/**
 * The inline inset every view holds off the viewport edges. Lives as a var so a
 * horizontally scrolling listing can break flush to the edge and re-pad itself
 * by the exact same amount — see `section-grid.css.ts`. Keeping it a single
 * definition means the breakout can never drift wider than the inset (which
 * would overflow `content` and force the page-level scroll this layout exists
 * to prevent).
 */
export const inset = createVar();

/**
 * The gallery `<main>` frame, pinned to the viewport via `inset: 0` so it
 * has a definite height to divide between the header and the scrolling
 * `content` below it. A flex chain off the body alone can't do this: the
 * body reset is `min-height: 100dvh` (a floor, not a definite height), so a
 * tall view grows the body and scrolls the whole page — header included.
 * Restating the viewport height here would work but duplicates that reset
 * (and trips `require-design-tokens`); `inset: 0` gives the same definite
 * box without a viewport unit.
 *
 * Containing the scroll keeps the header in a fixed slot for free, without
 * positioning it: it stays in normal flow above the scrollport while
 * `content` takes the overflow. The alternative — body scroll with the
 * header pinned — would need the header positioned, and then the views'
 * positioned chrome (Tabs active indicators, trigger overlays) would paint
 * over it: that chrome sits later in the DOM, and lifting the header back on
 * top needs `z-index`, which is off the table. Trapping the scroll here
 * sidesteps the stacking question entirely — the header never shares a
 * scrollport with that chrome, so there's nothing to overlap.
 */
export const layout = style({
  position: 'absolute',
  inset: 0,
});

/**
 * The active view. Fills the space below the site header and owns its own
 * vertical scroll — `min-height: 0` lets it shrink past its content so the
 * overflow stays here rather than growing the page.
 *
 * The `background` is load-bearing, not decorative: it's the same `page` color
 * the root canvas already shows, but painting it *here* makes the scrollport
 * opaque. The root document scroller gets a fast, compositor-driven scroll for
 * free; a transparent inner scroller doesn't — the compositor can't cache and
 * translate its tiles, so every frame repaints on the main thread and long
 * views scroll with visible jank. An opaque surface restores the cheap path.
 *
 * `overflow-x` is pinned to `hidden` rather than left to default: a non-`visible`
 * `overflow-y` promotes the other axis to `auto`, so the page would sprout a
 * horizontal scrollbar the moment anything overflowed. Nothing here ever scrolls
 * horizontally by design — wide listings keep their own x-scroll — so the axis
 * is clamped. The `inset` padding holds content off the edges; a horizontally
 * scrolling listing breaks back out to them (see `section-grid.css.ts`).
 */
export const content = style({
  vars: { [inset]: space[5] },
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: inset,
  backgroundColor: background.page,
});
