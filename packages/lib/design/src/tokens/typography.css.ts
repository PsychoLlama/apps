/**
 * Typography tokens ported from Radix UI Themes' type system.
 * Source: https://github.com/radix-ui/themes (MIT)
 *
 * Key differences from Radix:
 * - Uses rem instead of calc(px * var(--scaling)). Respects browser
 *   font-size preferences instead of requiring a separate scaling knob.
 * - The `baselineOffset` constant below is Radix's
 *   `--default-leading-trim-end` (0.36em), tuned to the dominant sans
 *   metric of the system font stack (-apple-system / Segoe UI / Roboto).
 *   Update if the body stack changes.
 * - Strong gets bold weight via per-component CSS rather than a
 *   themeable `--strong-font-family` knob.
 */
import {
  assignVars,
  createThemeContract,
  globalFontFace,
  globalStyle,
} from '@vanilla-extract/css';

// --- Contracts ---

/**
 * Font stacks for body, heading, inline code, italic emphasis, and
 * inline quotation. Heading defaults to body. Em/quote run a serif
 * italic so emphasized text contrasts with the surrounding sans.
 */
export const fontFamily = createThemeContract({
  body: null,
  heading: null,
  code: null,
  em: null,
  quote: null,
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
 * Distance from the alphabetic baseline to the bottom of the content area
 * for the body sans. Used by the leading-trim polyfill to compute negative
 * margins that remove half-leading whitespace. Mirrors Radix's
 * `--default-leading-trim-end`.
 */
export const baselineOffset = '0.36em';

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
  /** Tighten italic emphasis; offsets the loose ascent of italic glyphs. */
  em: '-0.025em',
  /** Tighten italic quotes. Same correction as `em`. */
  quote: '-0.025em',
} as const;

/**
 * Per-element font-size multipliers that compensate for visual size
 * differences between the body sans and the per-element family. Mirror
 * Radix's `--em-font-size-adjust` (1.18), `--quote-font-size-adjust`
 * (1.18), and `--code-font-size-adjust` (0.95). Applied as
 * `font-size: calc(adjust * 1em)` (or `calc(typeScale.fontSize *
 * adjust)` inside size variants).
 */
export const fontSizeAdjust = {
  /** Times italic looks small at 1em; bump it up. */
  em: '1.18',
  /** Same Times italic correction as Em. */
  quote: '1.18',
  /** Menlo/Consolas look big at 1em; nudge down. */
  code: '0.95',
} as const;

// --- Assignment ---

const sansStack = [
  '-apple-system',
  'BlinkMacSystemFont',
  "'Segoe UI (Custom)'",
  'Roboto',
  "'Helvetica Neue'",
  "'Open Sans (Custom)'",
  'system-ui',
  'sans-serif',
  "'Apple Color Emoji'",
  "'Segoe UI Emoji'",
].join(', ');

const monoStack = [
  "'Menlo'",
  "'Consolas (Custom)'",
  "'Bitstream Vera Sans Mono'",
  'monospace',
  "'Apple Color Emoji'",
  "'Segoe UI Emoji'",
].join(', ');

const serifItalicStack = ["'Times New Roman'", "'Times'", 'serif'].join(', ');

globalStyle(':root', {
  vars: {
    ...assignVars(fontFamily, {
      body: sansStack,
      heading: sansStack,
      code: monoStack,
      em: serifItalicStack,
      quote: serifItalicStack,
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

// --- Metric-normalized @font-face overrides ---

// Ported verbatim from Radix UI Themes. These declarations don't fetch
// remote fonts — they only `local()` the system-installed copies of
// Segoe UI, Open Sans, and Consolas, then apply size/ascent/descent
// overrides so cross-platform line boxes stay close to -apple-system's
// metrics. Without them, Windows users render Segoe UI with its native
// (taller) line geometry and Linux users with Open Sans drift in the
// opposite direction.

const segoeUiOverrides = {
  sizeAdjust: '103%',
  descentOverride: '35%',
  ascentOverride: '105%',
} as const;

globalFontFace('Segoe UI (Custom)', {
  ...segoeUiOverrides,
  fontWeight: '300',
  src: "local('Segoe UI Semilight'), local('Segoe UI')",
});
globalFontFace('Segoe UI (Custom)', {
  ...segoeUiOverrides,
  fontWeight: '300',
  fontStyle: 'italic',
  src: "local('Segoe UI Semilight Italic'), local('Segoe UI Italic')",
});
globalFontFace('Segoe UI (Custom)', {
  ...segoeUiOverrides,
  fontWeight: '400',
  src: "local('Segoe UI')",
});
globalFontFace('Segoe UI (Custom)', {
  ...segoeUiOverrides,
  fontWeight: '400',
  fontStyle: 'italic',
  src: "local('Segoe UI Italic')",
});
globalFontFace('Segoe UI (Custom)', {
  ...segoeUiOverrides,
  fontWeight: '500',
  src: "local('Segoe UI Semibold'), local('Segoe UI')",
});
globalFontFace('Segoe UI (Custom)', {
  ...segoeUiOverrides,
  fontWeight: '500',
  fontStyle: 'italic',
  src: "local('Segoe UI Semibold Italic'), local('Segoe UI Italic')",
});
globalFontFace('Segoe UI (Custom)', {
  ...segoeUiOverrides,
  fontWeight: '700',
  src: "local('Segoe UI Bold')",
});
globalFontFace('Segoe UI (Custom)', {
  ...segoeUiOverrides,
  fontWeight: '700',
  fontStyle: 'italic',
  src: "local('Segoe UI Bold Italic')",
});

const openSansOverrides = {
  descentOverride: '35%',
} as const;

globalFontFace('Open Sans (Custom)', {
  ...openSansOverrides,
  fontWeight: '300',
  src: "local('Open Sans Light'), local('Open Sans Regular')",
});
globalFontFace('Open Sans (Custom)', {
  ...openSansOverrides,
  fontWeight: '300',
  fontStyle: 'italic',
  src: "local('Open Sans Light Italic'), local('Open Sans Italic')",
});
globalFontFace('Open Sans (Custom)', {
  ...openSansOverrides,
  fontWeight: '400',
  src: "local('Open Sans Regular')",
});
globalFontFace('Open Sans (Custom)', {
  ...openSansOverrides,
  fontWeight: '400',
  fontStyle: 'italic',
  src: "local('Open Sans Italic')",
});
globalFontFace('Open Sans (Custom)', {
  ...openSansOverrides,
  fontWeight: '500',
  src: "local('Open Sans Medium'), local('Open Sans Regular')",
});
globalFontFace('Open Sans (Custom)', {
  ...openSansOverrides,
  fontWeight: '500',
  fontStyle: 'italic',
  src: "local('Open Sans Medium Italic'), local('Open Sans Italic')",
});
globalFontFace('Open Sans (Custom)', {
  ...openSansOverrides,
  fontWeight: '700',
  src: "local('Open Sans Bold')",
});
globalFontFace('Open Sans (Custom)', {
  ...openSansOverrides,
  fontWeight: '700',
  fontStyle: 'italic',
  src: "local('Open Sans Bold Italic')",
});

const consolasOverrides = {
  sizeAdjust: '110%',
  ascentOverride: '85%',
  descentOverride: '22%',
} as const;

globalFontFace('Consolas (Custom)', {
  ...consolasOverrides,
  fontWeight: '400',
  src: "local('Consolas')",
});
globalFontFace('Consolas (Custom)', {
  ...consolasOverrides,
  fontWeight: '400',
  fontStyle: 'italic',
  src: "local('Consolas Italic')",
});
globalFontFace('Consolas (Custom)', {
  ...consolasOverrides,
  fontWeight: '700',
  src: "local('Consolas Bold')",
});
globalFontFace('Consolas (Custom)', {
  ...consolasOverrides,
  fontWeight: '700',
  fontStyle: 'italic',
  src: "local('Consolas Bold Italic')",
});
