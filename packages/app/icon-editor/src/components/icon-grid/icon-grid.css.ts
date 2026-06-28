import { style } from '@vanilla-extract/css';
import { accent, fast, neutral, radius, space, standard } from '@lib/design';

// Fills the editing rail directly (it's no longer wrapped in a padded
// tab panel). Owns its own internal padding so the search bar and grid
// stay clear of the rail border, and `flex: 1 1 auto` + `minHeight: 0`
// let the inner ScrollArea claim the leftover height.
export const root = style({
  flex: '1 1 auto',
  minHeight: 0,
  paddingBlock: space[3],
  paddingInline: space[3],
});

// `ScrollArea` claims the leftover vertical space inside its column
// flex parent. `flex: 1 1 0` keeps it from collapsing; `minHeight: 0`
// is the standard escape from flex's content-driven minimum so the
// inner viewport actually scrolls.
export const scroller = style({
  flex: '1 1 0',
  minHeight: 0,
});

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
  gap: space[1],
  width: '100%',
  paddingBlock: space[1],
  paddingInline: space[1],
  // Pack rows to the top instead of stretching them across the full
  // grid height when filtering returns a partial result. Default
  // `align-content: normal` resolves to `stretch` for grid containers.
  alignContent: 'start',
});

export const tile = style({
  aspectRatio: '1 / 1',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: space[1],
  borderRadius: radius[2],
  backgroundColor: 'transparent',
  border: `1px solid transparent`,
  color: neutral.solid[12],
  cursor: 'pointer',
  transitionProperty: 'background-color, border-color, color, transform',
  transitionDuration: fast[2],
  transitionTimingFunction: standard.productive,
  // Hundreds of tiles share this rule; letting the browser skip style
  // and layout for off-screen ones keeps pagination-click cost near
  // constant regardless of how far past the fold the grid extends.
  // `contain-intrinsic-size: auto 40px 40px` matches the grid's
  // `minmax(40px, 1fr)` minimum, with `auto` so the browser caches
  // the actual size after first paint.
  contentVisibility: 'auto',
  containIntrinsicSize: 'auto 40px 40px',
  ':hover': {
    backgroundColor: neutral.alpha[3],
  },
  ':active': {
    backgroundColor: neutral.alpha[4],
    transform: 'scale(0.96)',
  },
  ':focus-visible': {
    outline: 'none',
    borderColor: accent.solid[8],
    boxShadow: `0 0 0 2px ${accent.alpha[5]}`,
  },
  ':disabled': {
    cursor: 'default',
  },
});

export const tileIcon = style({
  width: '100%',
  height: '100%',
});

// Body still loading — shown in place of the SVG until the page
// chunk arrives. Keeps the grid stable so tiles don't reflow.
export const tileSkeleton = style({
  width: '60%',
  height: '60%',
  borderRadius: radius[1],
  backgroundColor: neutral.alpha[3],
});

export const tileActive = style({
  backgroundColor: accent.alpha[4],
  color: accent.solid[11],
  ':hover': {
    backgroundColor: accent.alpha[5],
  },
});

export const empty = style({
  paddingBlock: space[5],
  textAlign: 'center',
});

// Pack list — vertical column of `<PackCard>`s living inside a
// ScrollArea. Padding only; layout (display/direction/gap) comes
// from the Flex prop bundle so the gap can be tuned in JSX.
export const packList = style({
  paddingBlock: space[1],
  paddingInline: space[1],
});

// Pager footer — sticks to the bottom of the icon panel and tabular-
// numbers the count text so the row width doesn't twitch as the user
// pages through. `flexShrink: 0` keeps the grid from absorbing the
// footer's height when scroll content is short.
export const pager = style({
  flexShrink: 0,
  paddingBlock: space[1],
  fontVariantNumeric: 'tabular-nums',
});
