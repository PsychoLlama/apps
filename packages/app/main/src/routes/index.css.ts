import { style } from '@vanilla-extract/css';
import { accent, fast, neutral, radius, space, standard } from '@lib/design';

export const column = style({
  maxWidth: '480px',
  width: '100%',
});

export const link = style({
  display: 'flex',
  alignItems: 'center',
  gap: space[4],
  textDecoration: 'none',
  padding: space[4],
  borderRadius: radius[4],
  transition: `background-color ${fast[2]} ${standard.productive}`,
  ':hover': {
    backgroundColor: neutral.solid[3],
  },
  ':active': {
    backgroundColor: neutral.solid[4],
  },
});

export const indicator = style({
  width: space[2],
  height: space[2],
  minWidth: space[2],
  borderRadius: radius.full,
  backgroundColor: accent.solid[9],
});

export const linkDisabled = style({
  cursor: 'not-allowed',
  ':hover': {
    backgroundColor: 'transparent',
  },
  ':active': {
    backgroundColor: 'transparent',
  },
});

export const indicatorDisabled = style({
  width: space[2],
  height: space[2],
  minWidth: space[2],
  borderRadius: radius.full,
  backgroundColor: neutral.solid[7],
});
