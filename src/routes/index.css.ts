import { style } from '@vanilla-extract/css';
import {
  accent,
  neutral,
  fontWeight,
  space,
  text,
  typeScale,
  radius,
} from '#design-system';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100dvh',
});

export const content = style({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: space[5],
});

export const column = style({
  maxWidth: '480px',
  width: '100%',
});

export const heading = style({
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  letterSpacing: typeScale[2].letterSpacing,
  fontWeight: fontWeight.medium,
  color: text.lowContrast,
  marginBottom: space[5],
});

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: space[3],
});

export const link = style({
  display: 'flex',
  alignItems: 'center',
  gap: space[4],
  textDecoration: 'none',
  padding: `${space[4]} ${space[4]}`,
  borderRadius: radius[4],
  transition: 'background-color 0.12s ease',
  ':hover': {
    backgroundColor: neutral[3],
  },
  ':active': {
    backgroundColor: neutral[4],
  },
});

export const indicator = style({
  width: space[2],
  height: space[2],
  minWidth: space[2],
  borderRadius: radius.full,
  backgroundColor: accent[9],
});

export const appInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: space[1],
});

export const appName = style({
  fontSize: typeScale[3].fontSize,
  lineHeight: typeScale[3].lineHeight,
  letterSpacing: typeScale[3].letterSpacing,
  fontWeight: fontWeight.medium,
  color: text.highContrast,
});

export const appDescription = style({
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  letterSpacing: typeScale[2].letterSpacing,
  fontWeight: fontWeight.regular,
  color: text.lowContrast,
});
