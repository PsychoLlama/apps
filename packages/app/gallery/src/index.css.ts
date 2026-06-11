import { style } from '@vanilla-extract/css';
import { neutral } from '@lib/design';

/**
 * The persistent left rail. A fixed-width column that never shrinks, divided
 * from the content area by the same hairline the site header uses.
 */
export const sidebar = style({
  flexShrink: 0,
  width: '15rem',
  borderInlineEnd: `1px solid ${neutral.solid[6]}`,
});
