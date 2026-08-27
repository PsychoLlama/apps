/**
 * Global defaults: design opinions applied to elements.
 *
 * These are distinct from the CSS reset (which strips UA defaults without
 * adding opinions) and from token definitions (which declare design values
 * without applying them to elements).
 */
import { globalStyle } from '@vanilla-extract/css';

import { darkSelector, lightSelector } from './color-scheme';
import { accent, background } from './tokens/color.css';
import { fontFamily, fontWeight, typeScale } from './tokens/typography.css';

// --- Root ---

/**
 * Root baseline:
 * - color-scheme: enable `light-dark()` resolution
 * - background-color: page canvas from color tokens
 * - manipulation: disable double-tap zoom for faster taps
 * - tap-highlight-color: suppress the gray flash on iOS taps
 * - touch-callout: suppress the iOS long-press preview menu
 * - font smoothing: consistent antialiased rendering
 * - text-size-adjust: prevent mobile browsers from inflating font sizes
 * - overflow-wrap: break long words rather than overflow containers
 */
globalStyle(':root', {
  colorScheme: 'light dark',
  backgroundColor: background.page,
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  WebkitTouchCallout: 'none',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
  textSizeAdjust: 'none',
  WebkitTextSizeAdjust: 'none',
  overflowWrap: 'break-word',
});

// Support overriding the color scheme through application code.
globalStyle(lightSelector, { colorScheme: 'light' });
globalStyle(darkSelector, { colorScheme: 'dark' });

// --- Body ---

/** Full-height flex column. vh fallback for browsers without dvh support. */
globalStyle('body', {
  margin: 0,
  minHeight: ['100vh', '100dvh'],
  display: 'flex',
  flexDirection: 'column',
  fontFamily: fontFamily.body,
  fontWeight: fontWeight.regular,
  fontSize: typeScale[3].fontSize,
  lineHeight: typeScale[3].bodyLineHeight,
  letterSpacing: typeScale[3].letterSpacing,
  '@media': {
    // Installed, browsers may resolve viewport units against a chrome-inclusive
    // viewport for the first frames of a load, before standalone display mode
    // applies — `dvh` comes back one retractable URL bar too tall. The reset
    // above resolves inside that window and is never invalidated, leaving the
    // page permanently taller than the viewport.
    //
    // Percentages resolve against the initial containing block, which is right
    // from the first frame. Tabs keep `dvh` for its retracting-chrome behavior.
    '(display-mode: standalone)': {
      minHeight: '100%',
    },
  },
});

/**
 * Height basis for the standalone `min-height` above: a percentage needs a
 * definite height to resolve against.
 */
globalStyle('html', {
  '@media': {
    '(display-mode: standalone)': {
      height: '100%',
    },
  },
});

// --- Selection ---

/** Accent-tinted text selection highlight. */
globalStyle('::selection', {
  backgroundColor: accent.alpha[5],
});
