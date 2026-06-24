import { style } from '@vanilla-extract/css';

/**
 * Center the capped content column within the frame body's full height.
 * `Container` already grows to fill the body and top-aligns its content;
 * this shifts the main-axis justification to center so the message floats
 * in the middle of the viewport.
 */
export const centered = style({
  justifyContent: 'center',
});
