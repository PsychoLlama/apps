/**
 * Slider styles.
 *
 * Ported from Radix UI Themes Slider. Deviations:
 * - State driven by `aria-disabled` and `data-orientation` on the
 *   single root span. Radix splits Root/Track/Range/Thumb across
 *   primitives that each set their own data attrs; we render one
 *   element so the predicates live on it.
 * - No `--radius-thumb` indirection. Track and thumb both ride
 *   `trackBorderRadius` directly; the thumb's visible knob clamps
 *   to `max(radius[1], trackBorderRadius)` at the consumption
 *   site so a square track still gets a slightly rounded knob.
 * - Drops Radix's 3× hit-area pseudo on the thumb. Our visible knob
 *   (`::after`) extends past the thumb's box via negative `inset`,
 *   and pseudo-element clicks attribute back to the host — so the
 *   visible knob is the click target without an extra `z-index: -1`
 *   layer (which the project bans).
 * - Variant cross-element rules live inside `track`/`range`/`thumb`
 *   selectors that reach UP to the variant class on the root, since
 *   Vanilla Extract requires every selector to anchor on `&` and
 *   the project blocks `globalStyle` from component code.
 * - Drops the high-contrast variant.
 *
 * @see https://www.radix-ui.com/themes/docs/components/slider
 */

import { createVar, style, styleVariants } from '@vanilla-extract/css';
import {
  accent,
  black,
  danger,
  neutral,
  radius,
  shadow,
  space,
  success,
  warning,
} from '@lib/design';
import { assignColorSchemeVars } from '@lib/design/color-scheme';

// Vars set by the size, radius, color, and variant style blocks —
// every other rule reads them, so a single variant assignment reaches
// the whole slider.
const trackSize = createVar();
const trackBorderRadius = createVar();
const colorTrack = createVar();
const colorAlpha2 = createVar();
const colorAlpha5 = createVar();
const colorSolid3 = createVar();
const colorSolid6 = createVar();
const colorSolid8 = createVar();
const thumbBoxShadow = createVar();

// Mode-aware refinement that Radix flips per scheme. Assigned at
// `:root` once via `assignColorSchemeVars` so each rule reads a
// single var.
const disabledBlendMode = createVar();

assignColorSchemeVars(
  { [disabledBlendMode]: 'multiply' },
  { [disabledBlendMode]: 'screen' },
);

// Visual constants. Thumb fill stays white in every mode (matches the
// canonical slider knob); the rest is computed from `trackSize`.
const THUMB_COLOR = 'white';

// Thumb sits a touch above the track so it visually overshoots — same
// proportion Radix uses (`space[1]` = 0.25rem above track).
const thumbSize = `calc(${trackSize} + ${space[1]})`;

// Compose multi-layer shadow values. The plain string return dodges
// vanilla-extract's template-literal narrowing across variant rules.
const layeredShadow = (...layers: string[]): string => layers.join(', ');

// --- Variant ---
//
// Declared first so the `track`/`range`/`thumb` style blocks below
// can reach up to `${variant.X}` in their own selector lists. The
// per-variant `thumbBoxShadow` var is the only thing this block
// binds; everything else (track/range fills, disabled overrides) is
// expressed by descendants targeting the variant class.

const surfaceThumbShadow = `0 0 0 1px ${black[4]}`;
const classicThumbShadow = layeredShadow(
  `0 0 0 1px ${black[3]}`,
  `0 1px 3px ${black[1]}`,
  `0 2px 4px -1px ${black[1]}`,
);
const softThumbShadow = layeredShadow(
  `0 0 0 1px ${black[3]}`,
  `0 0 0 1px ${neutral.alpha[2]}`,
  `0 0 0 1px ${colorAlpha2}`,
  `0 1px 2px ${neutral.alpha[4]}`,
  `0 1px 3px -0.5px ${neutral.alpha[3]}`,
);

export const variant = styleVariants({
  surface: { vars: { [thumbBoxShadow]: surfaceThumbShadow } },
  classic: { vars: { [thumbBoxShadow]: classicThumbShadow } },
  soft: { vars: { [thumbBoxShadow]: softThumbShadow } },
});

// --- Root ---

export const root = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  flexGrow: 1,
  borderRadius: trackBorderRadius,
  // Block accidental selection during a drag.
  userSelect: 'none',
  // Disable the browser's panning/zooming gestures so a finger drag
  // moves the slider rather than scrolling the page.
  touchAction: 'none',

  selectors: {
    '&:where([data-orientation="horizontal"])': {
      width: 'stretch',
      height: trackSize,
    },
    '&:where([data-orientation="vertical"])': {
      flexDirection: 'column',
      width: trackSize,
      height: 'stretch',
    },
    '&:where([aria-disabled="true"])': {
      cursor: 'not-allowed',
      mixBlendMode: disabledBlendMode,
    },
  },
});

// --- Track ---

const surfaceTrackBorder = `inset 0 0 0 1px ${neutral.alpha[5]}`;
const surfaceTrackBorderDisabled = `inset 0 0 0 1px ${neutral.alpha[4]}`;

export const track = style({
  overflow: 'hidden',
  position: 'relative',
  flexGrow: 1,
  borderRadius: 'inherit',

  // Pseudo-element used by the classic variant for an inset highlight.
  // Surface and soft leave the box-shadow empty so it paints nothing.
  '::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
  },

  selectors: {
    [`${root}:where([data-orientation="horizontal"]) &`]: {
      height: trackSize,
    },
    [`${root}:where([data-orientation="vertical"]) &`]: {
      width: trackSize,
    },

    // Surface
    [`${variant.surface} &`]: {
      backgroundColor: neutral.alpha[3],
      boxShadow: surfaceTrackBorder,
    },
    [`${variant.surface}:where([aria-disabled="true"]) &`]: {
      boxShadow: surfaceTrackBorderDisabled,
    },

    // Classic — the inset shadow is painted on the `::before` so it
    // can dim under disabled state without touching the track's own
    // background.
    [`${variant.classic} &`]: {
      backgroundColor: neutral.alpha[3],
    },
    [`${variant.classic} &::before`]: {
      boxShadow: shadow[1],
    },
    [`${variant.classic}:where([aria-disabled="true"]) &::before`]: {
      opacity: 0.5,
    },

    // Soft
    [`${variant.soft} &`]: {
      backgroundColor: neutral.alpha[4],
    },
    [`${variant.soft}:where([aria-disabled="true"]) &`]: {
      backgroundColor: neutral.alpha[4],
      backgroundImage: 'none',
    },
  },
});

// --- Range ---

const classicRangeBevel = layeredShadow(
  `inset 0 0 0 1px ${neutral.alpha[3]}`,
  `inset 0 0 0 1px ${colorAlpha2}`,
  `inset 0 0 0 1px ${black[1]}`,
  `inset 0 1.5px 2px 0 ${black[2]}`,
);

export const range = style({
  position: 'absolute',
  borderRadius: 'inherit',

  selectors: {
    [`${root}:where([data-orientation="horizontal"]) &`]: {
      height: '100%',
    },
    [`${root}:where([data-orientation="vertical"]) &`]: {
      width: '100%',
    },

    // Surface
    [`${variant.surface} &`]: {
      backgroundColor: colorTrack,
      boxShadow: surfaceTrackBorder,
    },

    // Classic
    [`${variant.classic} &`]: {
      backgroundColor: colorTrack,
      boxShadow: classicRangeBevel,
    },

    // Soft — translucent overlay over a muted base. Same trick Radix
    // uses to keep the variant readable in dark mode without
    // `color-mix()`. The overlay rides `colorAlpha5` so it tracks
    // the active palette.
    [`${variant.soft} &`]: {
      backgroundColor: colorSolid6,
      backgroundImage: `linear-gradient(${colorAlpha5}, ${colorAlpha5})`,
    },

    // Cross-cut: when disabled, every variant suppresses the range.
    [`${root}:where([aria-disabled="true"]) &`]: {
      backgroundColor: 'transparent',
      backgroundImage: 'none',
      boxShadow: 'none',
    },
  },
});

// --- Thumb ---
//
// The visible knob is `::after` with a negative inset so it
// overshoots the track. Pseudo-elements attribute clicks back to the
// host element, so the knob is also the click target — no extra
// `::before` hit-area expansion (which would need `z-index: -1`).

const disabledThumbShadow = `0 0 0 1px ${neutral.alpha[5]}`;
const softDisabledThumbShadow = `0 0 0 1px ${neutral.alpha[5]}`;

export const thumb = style({
  display: 'block',
  position: 'absolute',
  width: thumbSize,
  height: thumbSize,
  // Safari paints a default focus ring otherwise.
  outline: 0,
  cursor: 'grab',

  '::after': {
    content: '""',
    position: 'absolute',
    inset: `calc(-0.25 * ${trackSize})`,
    backgroundColor: THUMB_COLOR,
    borderRadius: `max(${radius[1]}, ${trackBorderRadius})`,
    boxShadow: thumbBoxShadow,
    cursor: 'grab',
  },

  selectors: {
    '&:where(:active)': {
      cursor: 'grabbing',
    },
    '&:where(:active)::after': {
      cursor: 'grabbing',
    },

    // Outer focus halo: variant shadow plus a colored 3px ring and
    // an outer focus ring for high-contrast visibility.
    '&:where(:focus-visible)::after': {
      boxShadow: layeredShadow(
        thumbBoxShadow,
        `0 0 0 3px ${colorSolid3}`,
        `0 0 0 5px ${colorSolid8}`,
      ),
    },

    // Disabled fills (per variant). Each variant paints its own
    // disabled knob so the shadow can match the variant's border.
    [`${variant.surface}:where([aria-disabled="true"]) &::after`]: {
      backgroundColor: neutral.solid[1],
      boxShadow: disabledThumbShadow,
    },
    [`${variant.classic}:where([aria-disabled="true"]) &::after`]: {
      backgroundColor: neutral.solid[1],
      boxShadow: disabledThumbShadow,
    },
    [`${variant.soft}:where([aria-disabled="true"]) &::after`]: {
      backgroundColor: neutral.solid[1],
      boxShadow: softDisabledThumbShadow,
    },

    [`${root}:where([aria-disabled="true"]) &`]: {
      cursor: 'not-allowed',
    },
    [`${root}:where([aria-disabled="true"]) &::after`]: {
      cursor: 'not-allowed',
    },
  },
});

// --- Size ---
//
// Mirrors Radix's three-step rail (size 2 = `space[2]`, size 1 0.75×,
// size 3 1.25×). Small slider thumbs land near 10/12/14px, in line
// with most native range UI.

export const size = styleVariants({
  1: {
    vars: { [trackSize]: `calc(${space[2]} * 0.75)` },
  },
  2: {
    vars: { [trackSize]: space[2] },
  },
  3: {
    vars: { [trackSize]: `calc(${space[2]} * 1.25)` },
  },
});

// --- Color ---
//
// Each variant binds the palette refs the rest of the stylesheet
// reads. `track` paints the filled portion, `alpha[2]` is the
// translucent ghost layer used in the soft thumb shadow, `alpha[5]`
// drives the soft range overlay, `solid[3]` is the inner focus halo,
// `solid[6]` carries the soft range fill, `solid[8]` is the outer
// focus ring.

export const color = styleVariants({
  accent: {
    vars: {
      [colorTrack]: accent.track,
      [colorAlpha2]: accent.alpha[2],
      [colorAlpha5]: accent.alpha[5],
      [colorSolid3]: accent.solid[3],
      [colorSolid6]: accent.solid[6],
      [colorSolid8]: accent.solid[8],
    },
  },
  neutral: {
    vars: {
      [colorTrack]: neutral.track,
      [colorAlpha2]: neutral.alpha[2],
      [colorAlpha5]: neutral.alpha[5],
      [colorSolid3]: neutral.solid[3],
      [colorSolid6]: neutral.solid[6],
      [colorSolid8]: neutral.solid[8],
    },
  },
  danger: {
    vars: {
      [colorTrack]: danger.track,
      [colorAlpha2]: danger.alpha[2],
      [colorAlpha5]: danger.alpha[5],
      [colorSolid3]: danger.solid[3],
      [colorSolid6]: danger.solid[6],
      [colorSolid8]: danger.solid[8],
    },
  },
  warning: {
    vars: {
      [colorTrack]: warning.track,
      [colorAlpha2]: warning.alpha[2],
      [colorAlpha5]: warning.alpha[5],
      [colorSolid3]: warning.solid[3],
      [colorSolid6]: warning.solid[6],
      [colorSolid8]: warning.solid[8],
    },
  },
  success: {
    vars: {
      [colorTrack]: success.track,
      [colorAlpha2]: success.alpha[2],
      [colorAlpha5]: success.alpha[5],
      [colorSolid3]: success.solid[3],
      [colorSolid6]: success.solid[6],
      [colorSolid8]: success.solid[8],
    },
  },
});

// --- Radius ---
//
// The thumb mirrors the track radius with `radius[1]` as the floor so
// `none`/`small` still get a hint of rounding on the knob — without
// it, a square track produces a square thumb that looks accidental.
// Matches Radix's `max(--radius-1, --radius-thumb)` rule.

export const radiusVariant = styleVariants({
  none: { vars: { [trackBorderRadius]: '0px' } },
  small: { vars: { [trackBorderRadius]: radius[1] } },
  medium: { vars: { [trackBorderRadius]: radius[2] } },
  large: { vars: { [trackBorderRadius]: radius[3] } },
  full: { vars: { [trackBorderRadius]: radius.full } },
});
