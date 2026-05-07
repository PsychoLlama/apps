/**
 * TextArea styles.
 *
 * Ported from Radix UI Themes TextArea. Deviations:
 * - No `color` prop; `soft` uses the configured `accent`.
 * - Resize is applied to the wrapping `<div>` (with `overflow: hidden`)
 *   so consumers grab the entire visual surface, including padding.
 *   Matches Radix.
 *
 * @see https://www.radix-ui.com/themes/docs/components/text-area
 */

import { style, styleVariants } from '@vanilla-extract/css';
import {
  accent,
  background,
  fontFamily,
  fontWeight,
  neutral,
  radius,
  shadow,
  space,
  text,
  typeScale,
} from '@lib/design';

// --- Root ---

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  boxSizing: 'border-box',
  fontFamily: fontFamily.body,
  fontWeight: fontWeight.regular,
  textAlign: 'start',
  // Wrapping the `resize` handle requires `overflow: hidden`, otherwise
  // the textarea pokes out of the wrapper while the user drags.
  overflow: 'hidden',
  // Padding is applied here (not on the inner textarea) so dragging
  // the resize handle reshapes the entire visual surface and the
  // wrapper's onPointerDown handler can delegate clicks on the
  // padding to the textarea.
  cursor: 'text',

  selectors: {
    '&:has(textarea:focus-visible)': {
      outline: `2px solid ${accent.solid[8]}`,
      outlineOffset: '-1px',
    },
    '&:has(textarea:disabled)': {
      cursor: 'not-allowed',
    },
  },
});

// --- Textarea ---

export const input = style({
  flex: '1 1 auto',
  minWidth: 0,
  background: 'transparent',
  border: 0,
  outline: 'none',
  font: 'inherit',
  letterSpacing: 'inherit',
  color: text.highContrast,
  // Resize is owned by the wrapper.
  resize: 'none',
  width: '100%',
  borderRadius: 'inherit',

  selectors: {
    '&::placeholder': {
      color: neutral.alpha[10],
    },
    '&:where(:disabled, :read-only)': {
      cursor: 'text',
      color: neutral.alpha[11],
      WebkitTextFillColor: neutral.alpha[11],
    },
    '&:disabled': {
      cursor: 'not-allowed',
    },

    // Autofill (rare on textareas, but possible via password managers
    // for "address" multi-line fields). Restore the field foreground;
    // the wrapper paints an overlay to mask the yellow background.
    '&:where(:autofill, [data-com-onepassword-filled])': {
      WebkitTextFillColor: text.highContrast,
    },

    // Style the WebKit scrollbar that appears when content overflows.
    // The OS default is wide and unstyled — visually heavy inside a
    // small textarea. Match the field's design with a slim track and
    // a neutral-alpha thumb that picks up theme colors.
    '&::-webkit-scrollbar': {
      width: space[3],
      height: space[3],
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: neutral.alpha[8],
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: neutral.alpha[9],
    },
  },
});

// --- Size ---

// Radix's size 3 lands at 80px (5rem), which falls between space[9]
// (4rem / 64px) and the next reasonable token. Express it via tokens
// instead of a literal to keep the design-token rule clean.
const size3MinHeight = `calc(${space[8]} + ${space[6]})`;

export const size = styleVariants({
  1: {
    minHeight: space[8],
    borderRadius: radius[2],
    padding: `${space[1]} ${space[2]}`,
    fontSize: typeScale[1].fontSize,
    lineHeight: typeScale[1].bodyLineHeight,
    letterSpacing: typeScale[1].letterSpacing,
  },
  2: {
    minHeight: space[9],
    borderRadius: radius[2],
    padding: `${space[2]} ${space[3]}`,
    fontSize: typeScale[2].fontSize,
    lineHeight: typeScale[2].bodyLineHeight,
    letterSpacing: typeScale[2].letterSpacing,
  },
  3: {
    minHeight: size3MinHeight,
    borderRadius: radius[3],
    padding: `${space[2]} ${space[3]}`,
    fontSize: typeScale[3].fontSize,
    lineHeight: typeScale[3].bodyLineHeight,
    letterSpacing: typeScale[3].letterSpacing,
  },
});

// --- Variant ---

// Mirrors the TextField overlay: `background-color` can't override
// `:autofill`'s yellow, but a `background-image` painted on top can.
const autofillOverlay = (color: string) => ({
  selectors: {
    '&:has(textarea:where(:autofill, [data-com-onepassword-filled]))': {
      backgroundImage: `linear-gradient(${color}, ${color})`,
    },
  },
});

export const variant = styleVariants({
  surface: {
    backgroundColor: background.surface,
    boxShadow: `inset 0 0 0 1px ${neutral.alpha[7]}`,
    ...autofillOverlay(background.surface),
  },
  classic: {
    backgroundColor: background.surface,
    boxShadow: shadow[1],
    ...autofillOverlay(background.surface),
  },
  soft: {
    backgroundColor: accent.alpha[3],
    selectors: {
      // Drop the accent tint when the field can't be edited so the
      // disabled/readonly state reads as inert rather than highlighted.
      '&:has(textarea:where(:disabled, :read-only))': {
        backgroundColor: neutral.alpha[3],
      },
    },
  },
});

// --- Radius (matches TextField's scale) ---

export const radiusVariant = styleVariants({
  // Reset already zeroes border-radius; `none` is the cascade default.
  none: {},
  small: { borderRadius: radius[1] },
  medium: { borderRadius: radius[2] },
  large: { borderRadius: radius[3] },
  full: { borderRadius: radius.full },
});

// --- Resize ---

export const resize = styleVariants({
  none: { resize: 'none' },
  vertical: { resize: 'vertical' },
  horizontal: { resize: 'horizontal' },
  both: { resize: 'both' },
});
