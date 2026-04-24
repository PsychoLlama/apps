import { style } from '@vanilla-extract/css';
import {
  background,
  breakpoint,
  fast,
  neutral,
  neutralAlpha,
  radius,
  space,
  standard,
  text,
  typeScale,
} from '@lib/design';

export const shell = style({
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
});

export const body = style({
  minHeight: 0,
});

export const main = style({
  padding: space[5],
  minHeight: 0,
  gap: space[4],
  '@media': {
    [breakpoint.sm]: {
      padding: space[6],
      gap: space[5],
    },
  },
});

export const metaRow = style({
  width: '100%',
  maxWidth: '960px',
  gap: space[3],
  flexDirection: 'column',
  '@media': {
    [breakpoint.sm]: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  },
});

export const stage = style({
  width: '100%',
  maxWidth: '960px',
  aspectRatio: '16 / 9',
  borderRadius: radius[4],
  overflow: 'hidden',
  backgroundColor: background.panelSolid,
  border: `1px solid ${neutral[6]}`,
});

export const video = style({
  width: '100%',
  height: '100%',
  display: 'block',
});

export const downloadLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: space[2],
  height: space[6],
  paddingInline: space[3],
  borderRadius: radius[2],
  backgroundColor: 'transparent',
  boxShadow: `inset 0 0 0 1px ${neutral[7]}`,
  color: text.highContrast,
  textDecoration: 'none',
  transition: `background-color ${fast[2]} ${standard.productive}`,
  ':hover': {
    backgroundColor: neutralAlpha[3],
  },
});

export const duration = style({
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  letterSpacing: typeScale[2].letterSpacing,
  color: text.lowContrast,
  fontVariantNumeric: 'tabular-nums',
});

export const missing = style({
  maxWidth: '480px',
  width: '100%',
  textAlign: 'center',
  gap: space[4],
});
