import { style } from '@vanilla-extract/css';
import { fontFamily } from '#design';

export { size, weight, align, color } from '../text/text.css';

export const base = style({
  fontFamily: fontFamily.heading,
});
