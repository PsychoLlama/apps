/**
 * Typography tokens derived from Radix UI Themes' type scale.
 * Source: https://github.com/radix-ui/themes (MIT)
 *
 * Key differences from Radix:
 * - Uses rem instead of calc(px * var(--scaling)). This respects browser
 *   font-size preferences instead of requiring a separate scaling knob.
 * - The `baselineOffset` constant below is derived from this font's metrics.
 *   Update it if the font family changes.
 * - No per-element font-size-adjust (unnecessary with a single font family).
 * - Loads IBM Plex Sans via @fontsource-variable instead of system font stacks.
 */
import {
  assignVars,
  createThemeContract,
  globalStyle,
} from '@vanilla-extract/css';

// --- Contracts ---

/** Font stacks for body, heading, and inline code text. Heading defaults to body. */
export const fontFamily = createThemeContract({
  body: null,
  heading: null,
  code: null,
});

/**
 * Absolute numeric font weights. Plain constants rather than a contract
 * because these are typographic invariants, not themeable design choices.
 */
export const fontWeight = {
  light: '300',
  regular: '400',
  medium: '500',
  bold: '700',
} as const;

export type FontWeight = keyof typeof fontWeight;

/**
 * 9-step coordinated type scale. Each step bundles fontSize, lineHeight, and
 * letterSpacing so they stay in sync — you always consume a full step, never
 * mix parts from different steps.
 *
 * The progression is non-linear: small increments at the bottom (body text),
 * large jumps at the top (display text). Letter spacing goes from slightly
 * loose (small text) to progressively tighter (large text).
 */
const stepShape = { fontSize: null, lineHeight: null, letterSpacing: null };
export const typeScale = createThemeContract({
  1: stepShape,
  2: stepShape,
  3: stepShape,
  4: stepShape,
  5: stepShape,
  6: stepShape,
  7: stepShape,
  8: stepShape,
  9: stepShape,
});

export type TypeScale = keyof typeof typeScale;

// --- Leading trim ---

/**
 * Distance from the alphabetic baseline to the center of the content area,
 * i.e. (ascent - |descent|) / (2 * UPM). Used by the leading-trim polyfill
 * to compute negative margins that remove half-leading whitespace.
 *
 * IBM Plex Sans: (1025 - 275) / 2000 = 0.375em
 */
export const baselineOffset = '0.375em';

/**
 * Per-style letter-spacing offsets composed with the surrounding text's
 * tracking. Mirrors Radix's `--code-letter-spacing` /
 * `--quote-letter-spacing` knobs — components that opt in compose
 * `calc(letterSpacingOffset.X + var(--letter-spacing))` so a Code or
 * Quote nested inside a sized Text picks up both the size's tracking
 * and its own per-style nudge.
 */
export const letterSpacingOffset = {
  /** Tighten monospace; offsets the wider native tracking. */
  code: '-0.007em',
  /** Tighten italic quotes; offsets the loose ascent of italic glyphs. */
  quote: '-0.025em',
} as const;

// --- Assignment ---

const sansStack = [
  "'IBM Plex Sans Variable'",
  "'IBM Plex Sans'",
  'ui-sans-serif',
  'system-ui',
  'sans-serif',
].join(', ');

const monoStack = [
  'ui-monospace',
  "'SF Mono'",
  'Menlo',
  'Consolas',
  "'Liberation Mono'",
  'monospace',
].join(', ');

globalStyle(':root', {
  vars: {
    ...assignVars(fontFamily, {
      body: sansStack,
      heading: sansStack,
      code: monoStack,
    }),

    ...assignVars(typeScale, {
      1: { fontSize: '0.75rem', lineHeight: '1rem', letterSpacing: '0.0025em' },
      2: { fontSize: '0.875rem', lineHeight: '1.25rem', letterSpacing: '0em' },
      3: { fontSize: '1rem', lineHeight: '1.5rem', letterSpacing: '0em' },
      4: {
        fontSize: '1.125rem',
        lineHeight: '1.625rem',
        letterSpacing: '-0.0025em',
      },
      5: {
        fontSize: '1.25rem',
        lineHeight: '1.75rem',
        letterSpacing: '-0.005em',
      },
      6: {
        fontSize: '1.5rem',
        lineHeight: '1.875rem',
        letterSpacing: '-0.00625em',
      },
      7: {
        fontSize: '1.75rem',
        lineHeight: '2.25rem',
        letterSpacing: '-0.0075em',
      },
      8: {
        fontSize: '2.1875rem',
        lineHeight: '2.5rem',
        letterSpacing: '-0.01em',
      },
      9: {
        fontSize: '3.75rem',
        lineHeight: '3.75rem',
        letterSpacing: '-0.025em',
      },
    }),
  },
});
