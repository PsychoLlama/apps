import { style } from '@vanilla-extract/css';
import { fontFamily } from '#design-system';

export { size, weight, align, color } from '../text/text.css';

export const base = style({
  fontFamily: fontFamily.heading,
  margin: 0,
});
