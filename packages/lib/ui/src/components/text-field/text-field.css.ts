/**
 * TextField styles.
 *
 * Ported from Radix UI Themes TextField. Deviations:
 * - No `color` prop; `soft` styles against the configured `accent`,
 *   `surface`/`classic` against `neutral`.
 * - Slot positioning is render-time (left/right props) rather than the
 *   `data-side` sibling-selector ordering Radix uses for compound `Slot`
 *   children.
 * - Border drawn via `box-shadow` inset (matches Radix) so the focus
 *   outline can ride the same edge with `outline-offset: -1px`.
 *
 * @see https://www.radix-ui.com/themes/docs/components/text-field
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
import {
  inputBorderRadius,
  inputHeight,
  inputPaddingX,
  slotGap,
} from './text-field.vars.css';

// --- Root ---

export const root = style({
  display: 'flex',
  alignItems: 'stretch',
  position: 'relative',
  height: inputHeight,
  paddingInline: inputPaddingX,
  borderRadius: inputBorderRadius,
  fontFamily: fontFamily.body,
  fontWeight: fontWeight.regular,
  textAlign: 'start',
  cursor: 'text',

  selectors: {
    '&:has(input:focus-visible)': {
      outline: `2px solid ${accent.solid[8]}`,
      outlineOffset: '-1px',
    },
    '&:has(input:disabled)': {
      cursor: 'not-allowed',
    },
  },
});

// --- Input ---

export const input = style({
  // `display: flex; align-items: center` is the canonical fix for
  // `<input type="date|time|datetime-local|month|week">` in Chrome
  // and Safari — those types render multiple sub-fields plus a
  // picker icon inside the input, and without this rule the
  // segments sit on the baseline instead of vertically centered.
  // No-op for plain text inputs.
  display: 'flex',
  alignItems: 'center',
  flex: '1 1 auto',
  minWidth: 0,
  background: 'transparent',
  border: 0,
  outline: 'none',
  font: 'inherit',
  letterSpacing: 'inherit',
  color: text.highContrast,

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

    // Hide the native chrome browsers paint inside the input — number
    // spinner, search cancel, Edge password reveal — so it doesn't fight
    // the design system. The picker indicator on date/time stays.
    '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
      WebkitAppearance: 'none',
    },
    '&[type="number"]': {
      MozAppearance: 'textfield',
    },
    '&::-webkit-search-cancel-button': {
      WebkitAppearance: 'none',
    },
    '&::-ms-reveal': {
      display: 'none',
    },

    // Style the date/time picker icon Chrome paints at the right of
    // those inputs. Sized in `em` so it tracks the field's font-size
    // (matches Radix's per-size 12/14/16px exactly). Hover bg matches
    // the field's hover affordances.
    '&::-webkit-calendar-picker-indicator': {
      width: '1em',
      height: '1em',
      color: 'inherit',
      cursor: 'pointer',
      borderRadius: radius[1],
    },
    '&::-webkit-calendar-picker-indicator:hover': {
      backgroundColor: neutral.alpha[3],
    },

    // Autofill (Chrome's `:autofill`, 1Password's marker attribute)
    // forces a yellow background and dark text color regardless of
    // page styles. Restore the field's intended foreground via
    // `-webkit-text-fill-color`; cover the yellow in `surface` and
    // `classic` via a `background-image` overlay applied on the root
    // (the input itself is transparent, so the overlay belongs there).
    '&:where(:autofill, [data-com-onepassword-filled])': {
      WebkitTextFillColor: text.highContrast,
    },
  },
});

// --- Slots ---

export const slot = style({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  cursor: 'text',
  color: neutral.alpha[11],
  gap: slotGap,
});

// Negative margins pull the slot one border-width past the wrapper's
// padding so slot content sits flush with the visual border (matching
// Radix). Soft has no border to overlap, but the 1px shift is
// imperceptible there and keeping the rule single makes the intent
// clearer than gating on variant.
/* eslint-disable custom/require-design-tokens */
export const slotLeft = style({
  paddingRight: slotGap,
  marginLeft: '-1px',
});

export const slotRight = style({
  paddingLeft: slotGap,
  marginRight: '-1px',
});
/* eslint-enable custom/require-design-tokens */

// --- Size ---

export const size = styleVariants({
  1: {
    fontSize: typeScale[1].fontSize,
    lineHeight: typeScale[1].lineHeight,
    letterSpacing: typeScale[1].letterSpacing,
    vars: {
      [inputHeight]: space[5],
      [inputPaddingX]: space[2],
      [slotGap]: space[2],
    },
  },
  2: {
    fontSize: typeScale[2].fontSize,
    lineHeight: typeScale[2].lineHeight,
    letterSpacing: typeScale[2].letterSpacing,
    vars: {
      [inputHeight]: space[6],
      [inputPaddingX]: space[2],
      [slotGap]: space[2],
    },
  },
  3: {
    fontSize: typeScale[3].fontSize,
    lineHeight: typeScale[3].lineHeight,
    letterSpacing: typeScale[3].letterSpacing,
    vars: {
      [inputHeight]: space[7],
      [inputPaddingX]: space[3],
      [slotGap]: space[3],
    },
  },
});

// --- Variant ---

// `background-color` can't be overridden inside `:autofill` (Chrome
// forces it), but a `background-image` painted on top of the yellow
// can. Apply it on the wrapper so it survives the input being
// transparent.
const autofillOverlay = (color: string) => ({
  selectors: {
    '&:has(input:where(:autofill, [data-com-onepassword-filled]))': {
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
      '&:has(input:focus-visible)': {
        outlineColor: accent.solid[8],
      },
      // Drop the accent tint when the field can't be edited so the
      // disabled/readonly state reads as inert rather than highlighted.
      '&:has(input:where(:disabled, :read-only))': {
        backgroundColor: neutral.alpha[3],
      },
    },
  },
});

// --- Radius ---

export const radiusVariant = styleVariants({
  // The reset zeroes border-radius. The base style already binds it to
  // `inputBorderRadius`, so `none` simply leaves the var unset and the
  // `0` default rides through.
  none: {},
  small: { vars: { [inputBorderRadius]: radius[1] } },
  medium: { vars: { [inputBorderRadius]: radius[2] } },
  large: { vars: { [inputBorderRadius]: radius[3] } },
  full: {
    vars: {
      [inputBorderRadius]: radius.full,
      [inputPaddingX]: space[3],
    },
  },
});
