import { style } from '@vanilla-extract/css';
import { text } from '@lib/design';

/**
 * A pangram specimen. Size, family, and weight ride in per cell via inline
 * style; the text stays on one line so each row reads as a single, comparable
 * sample (the grid scrolls its own x-axis when a sample runs wide).
 */
export const specimen = style({
  color: text.highContrast,
  whiteSpace: 'nowrap',
});
