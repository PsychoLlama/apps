import { style } from '@vanilla-extract/css';
import { background } from '@lib/design';

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
 */
export const content = style({
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  backgroundColor: background.page,
});
