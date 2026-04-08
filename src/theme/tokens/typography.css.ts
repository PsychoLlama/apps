import { createGlobalTheme } from '@vanilla-extract/css';
import { vars } from '../contract.css';

const fontSizePx = [12, 14, 16, 18, 20, 24, 28, 35, 60];
const lineHeightPx = [16, 20, 24, 26, 28, 30, 36, 40, 60];
const headingLineHeightPx = [16, 18, 22, 24, 26, 30, 36, 40, 60];
const letterSpacingEm = [
  0.0025, 0, 0, -0.0025, -0.005, -0.00625, -0.0075, -0.01, -0.025,
];

function scaleTokens(values: number[], unit: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < values.length; i++) {
    result[i + 1] =
      unit === 'px'
        ? `calc(${values[i]}px * ${vars.scaling})`
        : `${values[i]}${unit}`;
  }
  return result;
}

createGlobalTheme(':root', vars.fontSize, scaleTokens(fontSizePx, 'px'));
createGlobalTheme(':root', vars.lineHeight, scaleTokens(lineHeightPx, 'px'));
createGlobalTheme(
  ':root',
  vars.headingLineHeight,
  scaleTokens(headingLineHeightPx, 'px'),
);
createGlobalTheme(
  ':root',
  vars.letterSpacing,
  scaleTokens(letterSpacingEm, 'em'),
);

createGlobalTheme(':root', vars.fontWeight, {
  light: '300',
  regular: '400',
  medium: '500',
  bold: '700',
});

createGlobalTheme(':root', vars.font, {
  default: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Open Sans', system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'`,
  code: `'Menlo', 'Consolas', 'Bitstream Vera Sans Mono', monospace, 'Apple Color Emoji', 'Segoe UI Emoji'`,
  em: `'Times New Roman', 'Times', serif`,
  heading: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Open Sans', system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'`,
});
