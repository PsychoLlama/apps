/**
 * Switch styles.
 *
 * Ported from Radix UI Themes Switch. Deviations:
 * - No `color` prop; the "on" track uses the configured `accent`.
 * - No high-contrast variant.
 * - State driven by `aria-checked` and `:disabled` on the button rather
 *   than `data-state` data-attrs — same selectors, fewer attributes,
 *   and the predicates stay tied to the ARIA contract.
 * - Track durations consolidate Radix's hand-tuned 120/140/160ms
 *   values onto `moderate[1]` (with `fast[1]` for `:active` snap) so
 *   timings ride the design-system motion scale.
 *
 * @see https://www.radix-ui.com/themes/docs/components/switch
 */

import { style, styleVariants } from '@vanilla-extract/css';
import {
  accent,
  background,
  fast,
  moderate,
  neutral,
  radius,
  shadow,
  space,
  standard,
} from '@lib/design';
import {
  thumbInset,
  thumbSize,
  thumbTranslateX,
  trackBorderRadius,
  trackHeight,
  trackWidth,
} from './switch.vars.css';

// --- Root (the `<button role="switch">`) ---

// `1px` thumb inset and `1.75x` track aspect match Radix exactly. Both
// are visual constants of the control, not themeable values.
const THUMB_INSET = '1px';
const TRACK_ASPECT = 1.75;

export const root = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  verticalAlign: 'top',
  width: trackWidth,
  height: trackHeight,
  borderRadius: trackBorderRadius,
  cursor: 'pointer',

  vars: {
    [thumbInset]: THUMB_INSET,
    [trackWidth]: `calc(${trackHeight} * ${TRACK_ASPECT})`,
    [thumbSize]: `calc(${trackHeight} - ${thumbInset} * 2)`,
    [thumbTranslateX]: `calc(${trackWidth} - ${trackHeight})`,
  },

  // The visible track. Sliding `background-position` between 0% and 100%
  // reveals either the accent-track portion (checked) or the neutral
  // portion (unchecked) of an oversized horizontal gradient.
  '::before': {
    content: '""',
    display: 'block',
    width: trackWidth,
    height: trackHeight,
    borderRadius: 'inherit',
    backgroundRepeat: 'no-repeat',
    backgroundSize: `calc(${trackWidth} * 2 + ${trackHeight}) 100%`,
    transitionProperty:
      'background-position, background-color, box-shadow, filter',
    transitionTimingFunction: standard.productive,
    transitionDuration: moderate[1],
  },

  selectors: {
    '&:where([aria-checked="false"])::before': {
      backgroundPositionX: '100%',
    },
    '&:where([aria-checked="true"])::before': {
      backgroundPosition: '0%',
    },
    '&:where(:active)::before': {
      transitionDuration: fast[1],
    },
    '&:where(:focus-visible)::before': {
      outline: `2px solid ${accent.solid[8]}`,
      outlineOffset: '2px',
    },
    '&:where(:disabled)': {
      cursor: 'not-allowed',
    },
  },
});

// --- Thumb ---

// White even in dark mode — a solid white knob is the canonical
// switch affordance regardless of color scheme. Matches Radix.
const THUMB_COLOR = 'white';

export const thumb = style({
  position: 'absolute',
  left: thumbInset,
  width: thumbSize,
  height: thumbSize,
  // Thumb radius scales with the track radius minus the inset, so a
  // pill track gets a circular thumb and a square track gets a square
  // thumb with matching corners.
  borderRadius: `calc(${trackBorderRadius} - ${thumbInset})`,
  backgroundColor: THUMB_COLOR,
  transitionProperty: 'transform, box-shadow',
  transitionTimingFunction: standard.productive,
  transitionDuration: moderate[1],

  selectors: {
    [`${root}:where([aria-checked="true"]) &`]: {
      transform: `translateX(${thumbTranslateX})`,
    },
  },
});

// --- Size ---

// Size 2 lands between `space[4]` (1rem) and `space[5]` (1.5rem); the
// `5/6` factor matches Radix's 20px-at-default and rides our token
// scale rather than introducing a literal.
export const size = styleVariants({
  1: {
    vars: { [trackHeight]: space[4] },
  },
  2: {
    vars: { [trackHeight]: `calc(${space[5]} * 5 / 6)` },
  },
  3: {
    vars: { [trackHeight]: space[5] },
  },
});

// --- Variant ---

export const variant = styleVariants({
  surface: {
    selectors: {
      '&::before': {
        backgroundColor: neutral.alpha[3],
        backgroundImage: `linear-gradient(to right, ${accent.track} 40%, transparent 60%)`,
        boxShadow: `inset 0 0 0 1px ${neutral.alpha[5]}`,
      },
      '&:where(:active)::before': {
        backgroundColor: neutral.alpha[4],
      },
      '&:where(:disabled)::before': {
        backgroundImage: 'none',
        backgroundColor: neutral.alpha[3],
        boxShadow: `inset 0 0 0 1px ${neutral.alpha[3]}`,
      },
    },
  },

  classic: {
    selectors: {
      '&::before': {
        backgroundColor: neutral.alpha[4],
        backgroundImage: `linear-gradient(to right, ${accent.track} 40%, transparent 60%)`,
        boxShadow: shadow[1],
      },
      '&:where([aria-checked="false"]:active)::before': {
        backgroundColor: neutral.alpha[5],
      },
      '&:where(:disabled)::before': {
        backgroundImage: 'none',
        backgroundColor: neutral.alpha[4],
        boxShadow: shadow[1],
        opacity: 0.5,
      },
    },
  },

  // Soft layers four gradients so the unchecked track shows neutral and
  // the checked track shows a translucent accent — the same trick Radix
  // uses to keep the soft variant readable in both modes.
  soft: {
    selectors: {
      '&::before': {
        backgroundImage: [
          `linear-gradient(to right, ${accent.alpha[4]} 40%, transparent 60%)`,
          `linear-gradient(to right, ${accent.alpha[4]} 40%, transparent 60%)`,
          `linear-gradient(to right, ${accent.alpha[4]} 40%, ${background.surface} 60%)`,
          `linear-gradient(to right, ${neutral.alpha[2]} 40%, ${neutral.alpha[3]} 60%)`,
        ].join(', '),
      },
      '&:where([aria-checked="false"])::before': {
        backgroundColor: neutral.alpha[3],
      },
      '&:where(:active)::before': {
        backgroundColor: neutral.alpha[4],
      },
      '&:where(:disabled)::before': {
        backgroundImage: 'none',
        backgroundColor: neutral.alpha[4],
      },
    },
  },
});

// --- Radius ---

// `full` matches Radix's pill default. The other steps ride our shared
// radius scale; `none` lets the cascade default of 0 pass through.
export const radiusVariant = styleVariants({
  none: { vars: { [trackBorderRadius]: '0' } },
  small: { vars: { [trackBorderRadius]: radius[1] } },
  medium: { vars: { [trackBorderRadius]: radius[2] } },
  large: { vars: { [trackBorderRadius]: radius[3] } },
  full: { vars: { [trackBorderRadius]: radius.full } },
});
