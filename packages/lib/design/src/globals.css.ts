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
 * - user-select: disable text selection globally (opt-in per component)
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
  userSelect: 'none',
});

// Support overriding the color scheme through application code.
globalStyle(lightSelector, { colorScheme: 'light' });
globalStyle(darkSelector, { colorScheme: 'dark' });

// --- Body ---

/**
 * Full-height flex column. vh fallback for browsers without dvh support.
 * `overscroll-behavior: none` blocks pull-to-refresh and scroll chaining
 * from leaking into the document.
 */
globalStyle('body', {
  margin: 0,
  minHeight: ['100vh', '100dvh'],
  display: 'flex',
  flexDirection: 'column',
  overscrollBehavior: 'none',
  fontFamily: fontFamily.body,
  fontWeight: fontWeight.regular,
  fontSize: typeScale[3].fontSize,
  lineHeight: typeScale[3].lineHeight,
  letterSpacing: typeScale[3].letterSpacing,
});

// --- Selection ---

/** Accent-tinted text selection highlight. */
globalStyle('::selection', {
  backgroundColor: accent.alpha[5],
});
