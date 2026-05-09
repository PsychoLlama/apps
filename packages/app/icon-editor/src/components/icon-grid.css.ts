import { style } from '@vanilla-extract/css';
import { accent, fast, neutral, radius, space, standard } from '@lib/design';

export const root = style({
  minHeight: 0,
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

// Pack list — vertical column of `<Card>`s. The cards live inside
// a ScrollArea that claims the rail's leftover vertical space.
export const packList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: space[1],
  paddingBlock: space[1],
  paddingInline: space[1],
});

// Card layout overrides — `<Card>` defaults to `display: block` and
// inherits the host button's center-aligned text. We need left-
// aligned content so the pack name doesn't shift when the count
// label wraps.
export const packCard = style({
  textAlign: 'left',
});

// Selected pack indicator. `:where(.interactive:hover)` in Card has
// zero specificity, so a plain class with one nested `:hover` wins.
export const packCardActive = style({
  backgroundColor: accent.alpha[3],
  color: accent.solid[11],
  ':hover': {
    backgroundColor: accent.alpha[4],
  },
});

// Pack sample tile — sized to make the preview row prominent on the
// card. Each tile carries its own square footprint so non-square
// icons (Academicons 448×512, etc.) letterbox cleanly inside.
export const packSample = style({
  width: '32px',
  height: '32px',
  color: neutral.solid[11],
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
