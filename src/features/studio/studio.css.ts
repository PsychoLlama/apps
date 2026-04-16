import { keyframes, style } from '@vanilla-extract/css';
import {
  background,
  breakpoint,
  danger,
  fast,
  fontWeight,
  neutral,
  neutralAlpha,
  radius,
  space,
  standard,
  success,
  text,
  typeScale,
} from '#design';

const pulse = keyframes({
  '0%, 100%': { opacity: '1' },
  '50%': { opacity: '0.4' },
});

// --- Shell ---

export const shell = style({
  height: '100dvh',
  overflow: 'hidden',
});

// --- Body layout ---

export const body = style({
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  '@media': {
    [breakpoint.sm]: {
      flexDirection: 'row',
    },
  },
});

// --- Main area ---

export const main = style({
  padding: space[5],
  minHeight: 0,
  order: 1,
  '@media': {
    [breakpoint.sm]: {
      order: 0,
    },
  },
});

export const mainContent = style({
  maxWidth: '560px',
  width: '100%',
});

// --- Panel (RHS on desktop, bottom on mobile) ---

export const panel = style({
  backgroundColor: background.panelSolid,
  borderTop: `1px solid ${neutral[6]}`,
  minHeight: 0,
  order: 2,
  '@media': {
    [breakpoint.sm]: {
      width: '300px',
      minWidth: '300px',
      borderTop: 'none',
      borderLeft: `1px solid ${neutral[6]}`,
      order: 1,
    },
  },
});

export const panelHeader = style({
  cursor: 'pointer',
  transition: `background-color ${fast[2]} ${standard.productive}`,
  ':hover': {
    backgroundColor: neutral[3],
  },
  '@media': {
    [breakpoint.sm]: {
      cursor: 'default',
      ':hover': {
        backgroundColor: 'transparent',
      },
    },
  },
});

export const panelBody = style({
  flex: 1,
  overflowY: 'auto',
  maxHeight: '200px',
  '@media': {
    [breakpoint.sm]: {
      maxHeight: 'none',
    },
  },
});

export const panelFooter = style({
  borderTop: `1px solid ${neutral[6]}`,
});

// --- Recording entries ---

export const entryRow = style({
  transition: `background-color ${fast[2]} ${standard.productive}`,
  ':hover': {
    backgroundColor: neutral[3],
  },
});

export const entryLink = style({
  display: 'flex',
  alignItems: 'center',
  gap: space[3],
  flex: 1,
  minWidth: 0,
  cursor: 'pointer',
});

export const entryDelete = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: space[6],
  height: space[6],
  borderRadius: radius[2],
  color: text.lowContrast,
  cursor: 'pointer',
  transition: `background-color ${fast[2]} ${standard.productive}, color ${fast[2]} ${standard.productive}`,
  ':hover': {
    color: danger[9],
    backgroundColor: neutralAlpha[3],
  },
});

export const entryThumb = style({
  width: space[9],
  height: space[7],
  borderRadius: radius[2],
  backgroundColor: neutral[2],
  border: `1px solid ${neutral[6]}`,
  flexShrink: 0,
  overflow: 'hidden',
});

export const entryThumbIcon = style({
  color: neutral[8],
  fontSize: typeScale[3].fontSize,
});

export const truncate = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

// --- Recording state ---

export const recordingDot = style({
  width: space[2],
  height: space[2],
  borderRadius: radius.full,
  backgroundColor: danger[9],
  animation: `${pulse} 1.5s ease-in-out infinite`,
});

export const recordingDotPaused = style({
  width: space[2],
  height: space[2],
  borderRadius: radius.full,
  backgroundColor: neutral[8],
});

export const timer = style({
  fontSize: typeScale[8].fontSize,
  lineHeight: typeScale[8].lineHeight,
  letterSpacing: typeScale[8].letterSpacing,
  fontWeight: fontWeight.bold,
  color: text.highContrast,
  '@media': {
    [breakpoint.sm]: {
      fontSize: typeScale[9].fontSize,
      lineHeight: typeScale[9].lineHeight,
      letterSpacing: typeScale[9].letterSpacing,
    },
  },
});

// --- Active tracks ---

export const trackPill = style({
  display: 'flex',
  alignItems: 'center',
  gap: space[2],
  padding: `${space[1]} ${space[3]}`,
  borderRadius: radius.full,
  backgroundColor: neutralAlpha[3],
});

export const trackPillStopped = style({
  color: text.lowContrast,
});

export const trackDotLive = style({
  width: space[1],
  height: space[1],
  borderRadius: radius.full,
  backgroundColor: success[9],
  animation: `${pulse} 2s ease-in-out infinite`,
});

export const trackDotStopped = style({
  width: space[1],
  height: space[1],
  borderRadius: radius.full,
  backgroundColor: neutral[7],
});

export const trackStopButton = style({
  background: 'none',
  border: 'none',
  color: text.lowContrast,
  cursor: 'pointer',
  fontSize: typeScale[1].fontSize,
  lineHeight: typeScale[1].lineHeight,
  marginLeft: space[1],
  transition: `color ${fast[2]} ${standard.productive}`,
  ':hover': {
    color: danger[9],
  },
});

// --- Unsupported ---

export const unsupportedText = style({
  maxWidth: '320px',
});

// --- Empty library ---

export const emptyLibrary = style({
  padding: `${space[5]} ${space[4]}`,
});
