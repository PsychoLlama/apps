import { style } from '@vanilla-extract/css';
import { neutral, radius as radiusToken, space, typeScale } from '@lib/design';

/** Playground frame — sized to clearly show vertical and horizontal scroll. */
export const playgroundFrame = style({
  width: '20rem',
  height: '12rem',
  border: `1px solid ${neutral.alpha[5]}`,
  borderRadius: radiusToken[2],
});

/** Content that overflows both axes. */
export const bothContent = style({
  padding: space[3],
  width: '40rem',
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].bodyLineHeight,
});
