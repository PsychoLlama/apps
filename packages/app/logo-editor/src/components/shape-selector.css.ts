import { style } from '@vanilla-extract/css';
import { accent, fast, neutral, radius, space, standard } from '@lib/design';

export const group = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: space[2],
});

export const option = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingBlock: space[2],
  paddingInline: space[2],
  borderRadius: radius[2],
  backgroundColor: 'transparent',
  border: `1px solid ${neutral.solid[5]}`,
  color: neutral.solid[11],
  cursor: 'pointer',
  transitionProperty: 'background-color, border-color, color, transform',
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

export const optionActive = style({
  borderColor: accent.solid[8],
  backgroundColor: accent.alpha[3],
  color: accent.solid[11],
});

export const swatch = style({
  width: space[5],
  height: space[5],
  backgroundColor: 'currentColor',
});
