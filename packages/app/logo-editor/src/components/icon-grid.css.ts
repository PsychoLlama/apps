import { style } from '@vanilla-extract/css';
import { accent, fast, neutral, radius, space, standard } from '@lib/design';

export const root = style({
  minHeight: 0,
});

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
  gap: space[1],
  overflowY: 'auto',
  paddingBlock: space[1],
  paddingInline: space[1],
  // Fill whatever vertical space the parent panel allocates, then
  // scroll. The panel itself owns the dimension — on mobile it's a
  // fixed pixel height, on desktop it's the rail's leftover space.
  flex: '1 1 0',
  minHeight: 0,
  // Pack rows to the top instead of stretching them across the full
  // grid height when filtering returns a partial result. Default
  // `align-content: normal` resolves to `stretch` for grid containers.
  alignContent: 'start',
  // Tame inertia scroll when the grid is the only scroll surface.
  overscrollBehavior: 'contain',
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

// Pack list — vertical scroller of cards, each card showing the pack
// name plus a few sample icons. Mirrors the icon `grid` scroll
// behavior so it can claim the same rail space.
export const packList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: space[1],
  overflowY: 'auto',
  paddingBlock: space[1],
  paddingInline: space[1],
  flex: '1 1 0',
  minHeight: 0,
  overscrollBehavior: 'contain',
});

export const packCard = style({
  display: 'flex',
  alignItems: 'stretch',
  textAlign: 'left',
  paddingBlock: space[2],
  paddingInline: space[2],
  borderRadius: radius[2],
  backgroundColor: 'transparent',
  border: `1px solid transparent`,
  color: neutral.solid[12],
  cursor: 'pointer',
  transitionProperty: 'background-color, border-color, color',
  transitionDuration: fast[2],
  transitionTimingFunction: standard.productive,
  ':hover': {
    backgroundColor: neutral.alpha[3],
  },
  ':focus-visible': {
    outline: 'none',
    borderColor: accent.solid[8],
    boxShadow: `0 0 0 2px ${accent.alpha[5]}`,
  },
});

export const packCardActive = style({
  backgroundColor: accent.alpha[3],
  color: accent.solid[11],
  ':hover': {
    backgroundColor: accent.alpha[4],
  },
});

export const packSample = style({
  width: '20px',
  height: '20px',
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
