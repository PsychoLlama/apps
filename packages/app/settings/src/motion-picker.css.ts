import { style } from '@vanilla-extract/css';

/**
 * Aligns card content to the leading edge so the icon hugs the left
 * margin. Mirrors the appearance picker's layout — keeps the settings
 * sections visually consistent.
 */
export const card = style({
  justifyContent: 'flex-start',
});
