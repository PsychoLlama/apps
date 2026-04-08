import { keyframes, style } from '@vanilla-extract/css';
import {
  accent,
  background,
  breakpoint,
  fontWeight,
  neutral,
  neutralAlpha,
  radius,
  shadow,
  space,
  text,
  typeScale,
  white,
} from '#design-system';
import { redLight, redDark } from '../design-system/palette/red.css';
import { greenLight, greenDark } from '../design-system/palette/green.css';
import { amberLight, amberDark } from '../design-system/palette/amber.css';

const redSolid = `light-dark(${redLight[9]}, ${redDark[9]})`;
const greenSolid = `light-dark(${greenLight[9]}, ${greenDark[9]})`;
const amberSolid = `light-dark(${amberLight[9]}, ${amberDark[9]})`;

const pulse = keyframes({
  '0%, 100%': { opacity: '1' },
  '50%': { opacity: '0.4' },
});

// --- Shell ---

export const shell = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100dvh',
  overflow: 'hidden',
});

// --- Body layout ---

export const body = style({
  display: 'flex',
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
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: space[5],
  width: '100%',
  maxWidth: '560px',
});

// --- Panel (RHS on desktop, bottom on mobile) ---

export const panel = style({
  backgroundColor: background.panelSolid,
  borderTop: `1px solid ${neutral[6]}`,
  display: 'flex',
  flexDirection: 'column',
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
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${space[2]} ${space[4]}`,
  cursor: 'pointer',
  transition: 'background-color 0.12s ease',
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

export const panelHeading = style({
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  letterSpacing: typeScale[2].letterSpacing,
  fontWeight: fontWeight.medium,
  color: text.lowContrast,
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
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: typeScale[1].fontSize,
  lineHeight: typeScale[1].lineHeight,
  letterSpacing: typeScale[1].letterSpacing,
  color: text.lowContrast,
  padding: `${space[2]} ${space[4]}`,
  borderTop: `1px solid ${neutral[6]}`,
});

// --- Recording entries ---

export const entryLink = style({
  display: 'flex',
  alignItems: 'center',
  gap: space[3],
  padding: `${space[2]} ${space[4]}`,
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.12s ease',
  ':hover': {
    backgroundColor: neutral[3],
  },
});

export const entryThumb = style({
  width: space[9],
  height: space[7],
  borderRadius: radius[2],
  backgroundColor: neutral[2],
  border: `1px solid ${neutral[6]}`,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
});

export const entryThumbIcon = style({
  color: neutral[8],
  fontSize: typeScale[3].fontSize,
});

export const entryInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: space[1],
  minWidth: 0,
});

export const entryName = style({
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  letterSpacing: typeScale[2].letterSpacing,
  fontWeight: fontWeight.medium,
  color: text.highContrast,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const entryMeta = style({
  fontSize: typeScale[1].fontSize,
  lineHeight: typeScale[1].lineHeight,
  letterSpacing: typeScale[1].letterSpacing,
  color: text.lowContrast,
});

// --- Idle state ---

export const startButton = style({
  backgroundColor: accent[9],
  color: white[12],
  border: 'none',
  borderRadius: radius[2],
  fontSize: typeScale[3].fontSize,
  lineHeight: typeScale[3].lineHeight,
  letterSpacing: typeScale[3].letterSpacing,
  fontWeight: fontWeight.medium,
  padding: `${space[3]} ${space[7]}`,
  cursor: 'pointer',
  transition: 'background-color 0.12s ease',
  ':hover': {
    backgroundColor: accent[10],
  },
});

export const subtitle = style({
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  letterSpacing: typeScale[2].letterSpacing,
  color: text.lowContrast,
});

// --- Recording state ---

export const statusRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: space[2],
});

export const recordingDot = style({
  width: space[2],
  height: space[2],
  borderRadius: radius.full,
  backgroundColor: redSolid,
  animation: `${pulse} 1.5s ease-in-out infinite`,
});

export const recordingDotPaused = style({
  width: space[2],
  height: space[2],
  borderRadius: radius.full,
  backgroundColor: neutral[8],
});

export const statusLabel = style({
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  letterSpacing: typeScale[2].letterSpacing,
  fontWeight: fontWeight.medium,
  color: text.highContrast,
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

export const trackSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: space[3],
  width: '100%',
});

export const trackSectionLabel = style({
  fontSize: typeScale[1].fontSize,
  lineHeight: typeScale[1].lineHeight,
  letterSpacing: typeScale[1].letterSpacing,
  fontWeight: fontWeight.medium,
  color: text.lowContrast,
  textAlign: 'center',
});

export const trackList = style({
  display: 'flex',
  gap: space[2],
  flexWrap: 'wrap',
  justifyContent: 'center',
});

export const trackPill = style({
  display: 'flex',
  alignItems: 'center',
  gap: space[2],
  fontSize: typeScale[1].fontSize,
  lineHeight: typeScale[1].lineHeight,
  letterSpacing: typeScale[1].letterSpacing,
  color: text.highContrast,
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
  backgroundColor: greenSolid,
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
  lineHeight: '1',
  padding: 0,
  marginLeft: space[1],
  transition: 'color 0.12s ease',
  ':hover': {
    color: redSolid,
  },
});

// --- Controls ---

export const controlsRow = style({
  display: 'flex',
  gap: space[3],
  flexWrap: 'wrap',
  justifyContent: 'center',
});

export const ghostButton = style({
  backgroundColor: 'transparent',
  color: text.highContrast,
  border: `1px solid ${neutral[6]}`,
  borderRadius: radius[2],
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  letterSpacing: typeScale[2].letterSpacing,
  fontWeight: fontWeight.medium,
  padding: `${space[2]} ${space[5]}`,
  cursor: 'pointer',
  transition: 'background-color 0.12s ease',
  ':hover': {
    backgroundColor: neutral[3],
  },
});

export const solidButton = style({
  backgroundColor: accent[9],
  color: white[12],
  border: 'none',
  borderRadius: radius[2],
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  letterSpacing: typeScale[2].letterSpacing,
  fontWeight: fontWeight.medium,
  padding: `${space[2]} ${space[5]}`,
  cursor: 'pointer',
  transition: 'background-color 0.12s ease',
  ':hover': {
    backgroundColor: accent[10],
  },
});

export const dangerButton = style({
  backgroundColor: redSolid,
  color: white[12],
  border: 'none',
  borderRadius: radius[2],
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  letterSpacing: typeScale[2].letterSpacing,
  fontWeight: fontWeight.medium,
  padding: `${space[2]} ${space[5]}`,
  cursor: 'pointer',
});

// --- Error banner ---

export const errorBanner = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: space[3],
  backgroundColor: background.panelSolid,
  boxShadow: shadow[3],
  borderRadius: radius[4],
  padding: space[4],
  width: '100%',
});

export const errorIcon = style({
  width: space[7],
  height: space[7],
  borderRadius: radius[3],
  backgroundColor: neutralAlpha[3],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: amberSolid,
  fontSize: typeScale[5].fontSize,
});

export const errorBody = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: space[1],
});

export const errorTitle = style({
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  letterSpacing: typeScale[2].letterSpacing,
  fontWeight: fontWeight.medium,
  color: text.highContrast,
});

export const errorText = style({
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  letterSpacing: typeScale[2].letterSpacing,
  color: text.lowContrast,
});

export const dismissButton = style({
  background: 'none',
  border: 'none',
  color: text.lowContrast,
  cursor: 'pointer',
  fontSize: typeScale[3].fontSize,
  lineHeight: '1',
  padding: space[1],
  flexShrink: 0,
  borderRadius: radius[1],
  transition: 'color 0.12s ease, background-color 0.12s ease',
  ':hover': {
    color: text.highContrast,
    backgroundColor: neutral[3],
  },
});

// --- Unsupported ---

export const unsupported = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100dvh',
  padding: space[6],
  textAlign: 'center',
  gap: space[4],
});

export const unsupportedTitle = style({
  fontSize: typeScale[5].fontSize,
  lineHeight: typeScale[5].lineHeight,
  letterSpacing: typeScale[5].letterSpacing,
  fontWeight: fontWeight.medium,
  color: text.highContrast,
});

export const unsupportedText = style({
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  letterSpacing: typeScale[2].letterSpacing,
  color: text.lowContrast,
  maxWidth: '320px',
});

// --- State switcher (prototype only) ---

export const stateSwitcher = style({
  position: 'fixed',
  bottom: space[3],
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: space[1],
  zIndex: 100,
  backgroundColor: background.panelSolid,
  boxShadow: shadow[5],
  borderRadius: radius[3],
  padding: space[1],
});

export const switcherButton = style({
  fontSize: typeScale[1].fontSize,
  lineHeight: typeScale[1].lineHeight,
  letterSpacing: typeScale[1].letterSpacing,
  backgroundColor: 'transparent',
  color: text.lowContrast,
  border: 'none',
  borderRadius: radius[2],
  padding: `${space[1]} ${space[2]}`,
  cursor: 'pointer',
  transition: 'background-color 0.12s ease, color 0.12s ease',
  ':hover': {
    backgroundColor: neutral[3],
  },
});

export const switcherButtonActive = style({
  backgroundColor: neutral[3],
  color: text.highContrast,
});
