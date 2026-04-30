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
});

export const tileIcon = style({
  width: '100%',
  height: '100%',
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
