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

import {
  createVar,
  fallbackVar,
  style,
  styleVariants,
} from '@vanilla-extract/css';
import {
  accent,
  black,
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
import { assignColorSchemeVars } from '@lib/design/color-scheme';
import { lineHeight } from '../../vars/typography.css';

// Vars set by the size, radius, and color variants — every other rule
// reads them, so a single variant assignment reaches the whole switch.
const trackHeight = createVar();
const trackBorderRadius = createVar();
const colorTrack = createVar();
const colorAlpha3 = createVar();
const colorAlpha4 = createVar();
const colorFocus = createVar();

// Mode-aware refinements that Radix swaps per color scheme. The values
// are assigned at `:root` via `assignColorSchemeVars` so each rule
// below reads a single var and the cascade picks light vs dark.
const pressFilter = createVar();
const disabledBlendMode = createVar();

assignColorSchemeVars(
  {
    [pressFilter]: 'brightness(0.92) saturate(1.1)',
    [disabledBlendMode]: 'multiply',
  },
  {
    [pressFilter]: 'brightness(1.08)',
    [disabledBlendMode]: 'screen',
  },
);

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

// Compose multi-layer drop-shadow values. The plain string return
// dodges vanilla-extract's template-literal narrowing across variant
// rules.
const layeredShadow = (...layers: string[]): string => layers.join(', ');

// --- Root (the `<button role="switch">`) ---

export const root = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  verticalAlign: 'top',
  width: trackWidth,
  // Track the surrounding text's line-height when present so a switch
  // wrapped in `<Text as="label">` with multi-line copy stays aligned
  // with the first line of text rather than drifting to the geometric
  // center of the wrapped block. The `lineHeight` var is set by the
  // wrapping `<Text>` (size variants) and inherits to this descendant
  // via the CSS custom-property cascade. Standalone switches fall back
  // to `trackHeight`. The `::before` track and absolutely-positioned
  // thumb stay sized to `trackHeight` / `thumbSize`; root's
  // `align-items: center` re-centers them inside the taller box (the
  // thumb's static position is computed as a flex item, then frozen by
  // its abspos `top: auto`). Mirrors Radix's BaseRadio/Switch pattern.
  //
  // The outer `max(..., trackHeight)` guards against a smaller-text
  // ancestor shrinking the root below the visible track — Radix has
  // the same opportunity but doesn't take it.
  height: `max(${fallbackVar(lineHeight, trackHeight)}, ${trackHeight})`,
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
// Each variant binds the four palette refs the rest of the stylesheet
// reads. `track` is the checked-state fill; `alpha[3]` and `alpha[4]`
// drive the soft-variant gradient and the soft thumb's outer shadow;
// `solid[8]` paints the focus outline so it tracks the active color.

export const color = styleVariants({
  accent: {
    vars: {
      [colorTrack]: accent.track,
      [colorAlpha3]: accent.alpha[3],
      [colorAlpha4]: accent.alpha[4],
      [colorFocus]: accent.solid[8],
    },
  },
  neutral: {
    vars: {
      [colorTrack]: neutral.track,
      [colorAlpha3]: neutral.alpha[3],
      [colorAlpha4]: neutral.alpha[4],
      // Focus outline falls back to accent for the neutral palette
      // so the focus cue stays distinct against a gray switch —
      // same exception Radix's `--focus-8` codifies.
      [colorFocus]: accent.solid[8],
    },
  },
  danger: {
    vars: {
      [colorTrack]: danger.track,
      [colorAlpha3]: danger.alpha[3],
      [colorAlpha4]: danger.alpha[4],
      [colorFocus]: danger.solid[8],
    },
  },
  warning: {
    vars: {
      [colorTrack]: warning.track,
      [colorAlpha3]: warning.alpha[3],
      [colorAlpha4]: warning.alpha[4],
      [colorFocus]: warning.solid[8],
    },
  },
  success: {
    vars: {
      [colorTrack]: success.track,
      [colorAlpha3]: success.alpha[3],
      [colorAlpha4]: success.alpha[4],
      [colorFocus]: success.solid[8],
    },
  },
});

// --- Variant (track) ---
//
// The checked-track press filter and disabled blend mode read
// `pressFilter` / `disabledBlendMode`, which `assignColorSchemeVars`
// flips between light and dark values at `:root`. Per-variant per-state
// thumb shadows live in the `thumb` style block below — vanilla-extract
// requires each style to own its own selectors.

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
      '&:where([aria-checked="true"]:active)::before': {
        filter: pressFilter,
      },
      '&:where(:disabled)': {
        mixBlendMode: disabledBlendMode,
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
      '&:where([aria-checked="true"])::before': {
        boxShadow: layeredShadow(
          `inset 0 0 0 1px ${neutral.alpha[3]}`,
          `inset 0 0 0 1px ${colorAlpha4}`,
          `inset 0 0 0 1px ${black[1]}`,
          `inset 0 1.5px 2px 0 ${black[2]}`,
        ),
      },
      '&:where([aria-checked="false"]:active)::before': {
        backgroundColor: neutral.alpha[5],
      },
      '&:where([aria-checked="true"]:active)::before': {
        filter: pressFilter,
      },
      '&:where(:disabled)': {
        mixBlendMode: disabledBlendMode,
      },
      '&:where(:disabled)::before': {
        backgroundImage: 'none',
        backgroundColor: neutral.alpha[5],
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
      '&:where(:disabled)': {
        mixBlendMode: disabledBlendMode,
      },
      '&:where(:disabled)::before': {
        backgroundImage: 'none',
        backgroundColor: neutral.alpha[4],
      },
    },
  },
});

// --- Thumb ---
//
// Per-variant per-state shadows give the knob real depth. The selectors
// reach back up to the variant class on the parent root because
// vanilla-extract requires each style to own its own selectors —
// putting these inside the variant block would target a sibling class.
// The disabled thumb fill (`neutral.solid[2]`) and `transition: none`
// match Radix; the latter dodges Chrome's P3 red-channel artifact when
// flipping color schemes mid-transition.

const surfaceThumbDisabled = layeredShadow(
  `0 0 0 1px ${neutral.alpha[2]}`,
  `0 1px 3px ${black[1]}`,
);

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

    // Surface
    [`${variant.surface}:where([aria-checked="false"]) &`]: {
      boxShadow: layeredShadow(
        `0 0 1px 1px ${black[2]}`,
        `0 1px 1px ${black[1]}`,
        `0 2px 4px -1px ${black[1]}`,
      ),
    },
    [`${variant.surface}:where([aria-checked="true"]) &`]: {
      boxShadow: layeredShadow(
        `0 1px 3px ${black[2]}`,
        `0 2px 4px -1px ${black[1]}`,
        `0 0 0 1px ${black[1]}`,
        `0 0 0 1px ${colorAlpha4}`,
        `-1px 0 1px ${black[2]}`,
      ),
    },
    [`${variant.surface}:where(:disabled) &`]: {
      backgroundColor: neutral.solid[2],
      boxShadow: surfaceThumbDisabled,
      transition: 'none',
    },

    // Classic
    [`${variant.classic}:where([aria-checked="false"]) &`]: {
      boxShadow: layeredShadow(
        `0 1px 3px ${black[3]}`,
        `0 2px 4px -1px ${black[1]}`,
        `0 0 0 1px ${black[2]}`,
      ),
    },
    [`${variant.classic}:where([aria-checked="true"]) &`]: {
      boxShadow: layeredShadow(
        `0 1px 3px ${black[2]}`,
        `0 2px 4px -1px ${black[1]}`,
        `0 0 0 1px ${black[1]}`,
        `0 0 0 1px ${colorAlpha4}`,
        `-1px 0 1px ${black[2]}`,
      ),
    },
    [`${variant.classic}:where(:disabled) &`]: {
      backgroundColor: neutral.solid[2],
      boxShadow: surfaceThumbDisabled,
      transition: 'none',
    },

    // Soft — desaturated knob so it doesn't pop out of the muted track.
    [`${variant.soft} &`]: {
      filter: 'saturate(0.45)',
    },
    [`${variant.soft}:where([aria-checked="false"]) &`]: {
      boxShadow: layeredShadow(
        `0 0 0 1px ${black[1]}`,
        `0 1px 3px ${black[1]}`,
        `0 1px 3px ${black[1]}`,
        `0 2px 4px -1px ${black[1]}`,
      ),
    },
    [`${variant.soft}:where([aria-checked="true"]) &`]: {
      boxShadow: layeredShadow(
        `0 0 0 1px ${black[1]}`,
        `0 1px 3px ${black[2]}`,
        `0 1px 3px ${colorAlpha3}`,
        `0 2px 4px -1px ${colorAlpha3}`,
      ),
    },
    [`${variant.soft}:where(:disabled) &`]: {
      filter: 'none',
      backgroundColor: neutral.solid[2],
      boxShadow: surfaceThumbDisabled,
      transition: 'none',
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
