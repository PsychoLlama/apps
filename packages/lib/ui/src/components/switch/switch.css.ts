/**
 * Switch styles.
 *
 * Ported from Radix UI Themes Switch. Deviations:
 * - State driven by `aria-checked` and `:disabled` on the button rather
 *   than `data-state` data-attrs — same selectors, fewer attributes,
 *   and the predicates stay tied to the ARIA contract.
 * - Track durations consolidate Radix's hand-tuned 120/140/160ms
 *   values onto `moderate[1]` (with `fast[1]` for `:active` snap) so
 *   timings ride the design-system motion scale.
 * - Drops the high-contrast variant.
 *
 * @see https://www.radix-ui.com/themes/docs/components/switch
 */

import { createVar, style, styleVariants } from '@vanilla-extract/css';
import {
  accent,
  danger,
  fast,
  moderate,
  neutral,
  radius,
  shadow,
  space,
  standard,
  success,
  warning,
  white,
} from '@lib/design';

// Vars set by the size, radius, and color variants — every other rule
// reads them, so a single variant assignment reaches the whole switch.
const trackHeight = createVar();
const trackBorderRadius = createVar();
const colorTrack = createVar();
const colorAlpha4 = createVar();
const colorFocus = createVar();

// Visual constants of the control. `1px` thumb inset and `1.75x` track
// aspect match Radix exactly. White thumb in every mode is the
// canonical switch affordance.
const THUMB_INSET = '1px';
const TRACK_ASPECT = 1.75;
const THUMB_COLOR = 'white';

// Derived geometry. Composing the calcs once here keeps the rules below
// readable; nothing here needs its own CSS var since they're all
// functions of `trackHeight` and stay pinned to it as size changes.
const trackWidth = `calc(${trackHeight} * ${TRACK_ASPECT})`;
const thumbSize = `calc(${trackHeight} - ${THUMB_INSET} * 2)`;
const thumbTranslateX = `calc(${trackWidth} - ${trackHeight})`;
const trackBackgroundSize = `calc(${trackWidth} * 2 + ${trackHeight}) 100%`;

// --- Root (the `<button role="switch">`) ---

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
    backgroundSize: trackBackgroundSize,
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
      outline: `2px solid ${colorFocus}`,
      outlineOffset: '2px',
    },
    '&:where(:disabled)': {
      cursor: 'not-allowed',
    },
  },
});

// --- Thumb ---

export const thumb = style({
  position: 'absolute',
  left: THUMB_INSET,
  width: thumbSize,
  height: thumbSize,
  // Thumb radius scales with the track radius minus the inset, so a
  // pill track gets a circular thumb and a square track gets a square
  // thumb with matching corners.
  borderRadius: `calc(${trackBorderRadius} - ${THUMB_INSET})`,
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

// --- Color ---
//
// Each variant binds the three palette refs the rest of the stylesheet
// reads. The `track` color is the checked-state fill; `alpha[4]` drives
// the soft-variant gradient; `solid[8]` paints the focus outline so it
// tracks the active color.

export const color = styleVariants({
  accent: {
    vars: {
      [colorTrack]: accent.track,
      [colorAlpha4]: accent.alpha[4],
      [colorFocus]: accent.solid[8],
    },
  },
  neutral: {
    vars: {
      [colorTrack]: neutral.track,
      [colorAlpha4]: neutral.alpha[4],
      [colorFocus]: neutral.solid[8],
    },
  },
  danger: {
    vars: {
      [colorTrack]: danger.track,
      [colorAlpha4]: danger.alpha[4],
      [colorFocus]: danger.solid[8],
    },
  },
  warning: {
    vars: {
      [colorTrack]: warning.track,
      [colorAlpha4]: warning.alpha[4],
      [colorFocus]: warning.solid[8],
    },
  },
  success: {
    vars: {
      [colorTrack]: success.track,
      [colorAlpha4]: success.alpha[4],
      [colorFocus]: success.solid[8],
    },
  },
});

// --- Variant ---

export const variant = styleVariants({
  surface: {
    selectors: {
      '&::before': {
        backgroundColor: neutral.alpha[3],
        backgroundImage: `linear-gradient(to right, ${colorTrack} 40%, transparent 60%)`,
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
        backgroundImage: `linear-gradient(to right, ${colorTrack} 40%, transparent 60%)`,
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
  // uses to keep the soft variant readable in both modes. The `white[1]`
  // blend keeps the unchecked side legible against dark backgrounds.
  soft: {
    selectors: {
      '&::before': {
        backgroundImage: [
          `linear-gradient(to right, ${colorAlpha4} 40%, transparent 60%)`,
          `linear-gradient(to right, ${colorAlpha4} 40%, transparent 60%)`,
          `linear-gradient(to right, ${colorAlpha4} 40%, ${white[1]} 60%)`,
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
