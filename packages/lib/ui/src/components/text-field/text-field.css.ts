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

export const slotLeft = style({
  paddingRight: slotGap,
});

export const slotRight = style({
  paddingLeft: slotGap,
});

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

export const variant = styleVariants({
  surface: {
    backgroundColor: background.surface,
    boxShadow: `inset 0 0 0 1px ${neutral.alpha[7]}`,
  },
  classic: {
    backgroundColor: background.surface,
    boxShadow: shadow[1],
  },
  soft: {
    backgroundColor: accent.alpha[3],
    selectors: {
      '&:has(input:focus-visible)': {
        outlineColor: accent.solid[8],
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
