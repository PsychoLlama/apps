import { style } from '@vanilla-extract/css';
import { neutral, radius as radiusToken, space, typeScale } from '@lib/design';

/**
 * Caps each gallery cell so a vertical scroll area has a finite
 * viewport height and the scrollbars have something to track.
 */
export const galleryCell = style({
  width: '14rem',
  height: '8rem',
  border: `1px solid ${neutral.alpha[5]}`,
  borderRadius: radiusToken[2],
});

/** Playground frame — sized to clearly show vertical and horizontal scroll. */
export const playgroundFrame = style({
  width: '20rem',
  height: '12rem',
  border: `1px solid ${neutral.alpha[5]}`,
  borderRadius: radiusToken[2],
});

/** Tall content that overflows vertically. */
export const tallContent = style({
  padding: space[3],
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].bodyLineHeight,
});

/** Wide content that overflows horizontally. */
export const wideContent = style({
  padding: space[3],
  width: '40rem',
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].bodyLineHeight,
});

/** Content that overflows both axes. */
export const bothContent = style({
  padding: space[3],
  width: '40rem',
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].bodyLineHeight,
});
