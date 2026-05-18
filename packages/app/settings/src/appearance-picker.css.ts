import { style } from '@vanilla-extract/css';

/**
 * Aligns card content to the leading edge so the icon hugs the left
 * margin. Mirrors the theme picker's swatch layout — keeps the two
 * sections visually consistent.
 */
export const card = style({
  justifyContent: 'flex-start',
});
