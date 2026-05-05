import { fallbackVar, style } from '@vanilla-extract/css';
import { fontFamily } from '@lib/design';
import { letterSpacing, lineHeight } from '../../vars/typography.css';

export { size, weight, align, color } from '../text/text.css';

export const base = style({
  fontFamily: fontFamily.heading,
  lineHeight: fallbackVar(lineHeight, 'inherit'),
  letterSpacing: fallbackVar(letterSpacing, 'inherit'),
});
