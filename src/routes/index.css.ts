import { style } from '@vanilla-extract/css';
import { accent, fast, neutral, radius, space, standard } from '#design';

export const page = style({
  height: '100dvh',
});

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
    backgroundColor: neutral[3],
  },
  ':active': {
    backgroundColor: neutral[4],
  },
});

export const indicator = style({
  width: space[2],
  height: space[2],
  minWidth: space[2],
  borderRadius: radius.full,
  backgroundColor: accent[9],
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
  backgroundColor: neutral[7],
});
