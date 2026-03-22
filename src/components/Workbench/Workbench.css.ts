import { style, keyframes } from '@vanilla-extract/css';
import { spacing, palette, breakpoints, typography } from '../../theme';

const fadeIn = keyframes({
  '0%': { opacity: 0, transform: 'translateY(10px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' },
});

export const container = style({
  width: '100%',
  margin: '0 auto',
  padding: 0,
});

export const subheader = style({
  color: palette.text.secondary,
  fontWeight: 400,
  margin: 0,
  padding: spacing(2, 1),
  fontSize: '1.1rem',
  display: 'flex',
  justifyContent: 'center',
  textAlign: 'center',
  '@media': {
    [breakpoints.md]: {
      fontSize: '1.2rem',
      padding: spacing(3, 1),
    },
  },
});

export const apps = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  width: '100%',
  margin: '0 auto',
  padding: 0,
  '@media': {
    [breakpoints.md]: {
      padding: spacing(1, 2),
      flexDirection: 'row',
      gap: spacing(2),
    },
  },
});

export const appCard = style({
  background: 'rgba(255, 255, 255, 0.07)',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: '500px',
  animation: `${fadeIn} 0.5s ease-out forwards`,
  animationFillMode: 'both',
  position: 'relative',
  boxSizing: 'border-box',
  margin: 0,
  ':hover': {
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
    background: 'rgba(255, 255, 255, 0.1)',
  },
  selectors: {
    '&:nth-child(1)': {
      animationDelay: '0.1s',
    },
    '&:nth-child(2)': {
      animationDelay: '0.2s',
    },
    '&:nth-child(3)': {
      animationDelay: '0.3s',
    },
    '&:nth-child(4)': {
      animationDelay: '0.4s',
    },
  },
  '@media': {
    [breakpoints.md]: {
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '16px',
      marginBottom: spacing(2),
      ':hover': {
        border: `1px solid ${palette.primary.light}`,
      },
    },
  },
});

export const appLink = style({
  textDecoration: 'none',
  color: 'inherit',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  boxSizing: 'border-box',
  ':after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background:
      'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
    pointerEvents: 'none',
  },
  '@media': {
    [breakpoints.md]: {
      borderRadius: '16px',
    },
  },
});

export const appIconContainer = style({
  padding: spacing(4),
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '3.5rem',
  color: palette.primary.main,
  fontFamily: typography.emojiFontFamily,
  background: 'rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  selectors: {
    [`${appCard}:hover &`]: {
      color: palette.primary.light,
      transform: 'scale(1.05)',
    },
  },
});

export const appContent = style({
  padding: spacing(3, 4, 4),
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
});

export const appTitle = style({
  margin: 0,
  fontSize: '1.5rem',
  fontWeight: 700,
  color: palette.text.primary,
  marginBottom: spacing(1.5),
});

export const appDescription = style({
  margin: 0,
  fontSize: '1rem',
  color: palette.text.secondary,
  lineHeight: 1.6,
  maxWidth: '90%',
});
