/**
 * Progress styles.
 *
 * Ported from Radix UI Themes Progress. Deviations:
 * - Determinate vs. indeterminate is a class variant on the indicator,
 *   not a `data-state` data-attr. Same selectors, fewer attributes.
 * - The track-fill scaleX is applied as inline `transform` from the
 *   component, so the indeterminate keyframes don't fight a CSS var.
 *   Only the indeterminate `progressDuration` var is exposed inline.
 * - The indeterminate shine layer reads a single `shineGradient` var
 *   set by `assignColorSchemeVars`, mirroring Radix's per-mode tweak
 *   to the gradient stops.
 * - The determinate-fill transition rides our motion tokens
 *   (`moderate[1]` + `standard.productive`) instead of Radix's bare
 *   `120ms` with the browser-default `ease`. Curve is intentionally
 *   on the design-system contract.
 * - Drops the high-contrast variant.
 *
 * @see https://www.radix-ui.com/themes/docs/components/progress
 */

import {
  createVar,
  fallbackVar,
  keyframes,
  style,
  styleVariants,
} from '@vanilla-extract/css';
import {
  accent,
  danger,
  moderate,
  neutral,
  radius as radiusToken,
  shadow,
  space,
  standard,
  success,
  warning,
  white,
} from '@lib/design';
import { assignColorSchemeVars } from '@lib/design/color-scheme';

// Vars set by the size, radius, color, and variant blocks. The root
// owns geometry; the indicator reads color refs and animation refs the
// variant block fills in.
const trackHeight = createVar();
const trackBorderRadius = createVar();
const colorTrack = createVar();
const colorAlpha5 = createVar();
const colorSolid5 = createVar();
const colorSolid7 = createVar();
const colorSolid8 = createVar();
const fadeAnimation = createVar();
const pulseAnimation = createVar();

// The shine gradient color stops differ between light and dark — Radix
// uses brighter alpha-white in light mode so the highlight pops against
// the colored track.
const shineGradient = createVar();

assignColorSchemeVars(
  {
    [shineGradient]: `${white.step5}, ${white.step9}, ${white.step5}`,
  },
  {
    [shineGradient]: `${white.step3}, ${white.step6}, ${white.step3}`,
  },
);

// Per-instance var controlling how long the initial indeterminate
// "grow" phase runs before the indicator settles into a pulse. The
// component supplies the value via `assignInlineVars`; `fallbackVar`
// covers SSR / pre-hydration snapshots where the inline assignment
// hasn't landed yet.
export const progressDuration = createVar();
const progressDurationCss = fallbackVar(progressDuration, '5s');

// Indeterminate-loop cadence. These pace an ambient idle pulse, not a
// productive micro-interaction, so they don't ride the `fast`/`moderate`
// /`slow` motion scale. Captured as named constants so call-sites read
// as intent, not magic numbers.
const FADE_DURATION = '2.5s';
const PULSE_DURATION = '5s';
const SHINE_DURATION = '5s';

// --- Keyframes ---

// Determinate "grow" runs once at the start of an indeterminate cycle.
// The bar climbs from a sliver to nearly full, then `pulseAnimation`
// takes over forever.
const grow = keyframes({
  '0%': { transform: 'scaleX(0.01)' },
  '20%': { transform: 'scaleX(0.1)' },
  '30%': { transform: 'scaleX(0.6)' },
  '40%, 50%': { transform: 'scaleX(0.9)' },
  '100%': { transform: 'scaleX(1)' },
});

// The shine sweep moves a translucent gradient across the track once
// per pulse cycle.
const shine = keyframes({
  '0%': { transform: 'translateX(-100%)' },
  '100%': { transform: 'translateX(0%)' },
});

// Per-variant fade and pulse — surface and classic share the
// `track ↔ solid[7]` interpolation; soft sits on `solid[5] ↔ solid[7]`
// so the pulse stays inside the muted range. The keyframe values read
// the per-color CSS vars rather than `accent.*` directly so a non-
// accent `color` prop animates inside its own palette.
const surfaceFade = keyframes({
  '100%': { backgroundColor: colorSolid7 },
});
const surfacePulse = keyframes({
  '0%': { backgroundColor: colorSolid7 },
  '100%': { backgroundColor: colorTrack },
});

const softFade = keyframes({
  '100%': { backgroundColor: colorSolid5 },
});
const softPulse = keyframes({
  '0%': { backgroundColor: colorSolid5 },
  '100%': { backgroundColor: colorSolid7 },
});

// --- Root (the track) ---

export const root = style({
  position: 'relative',
  display: 'block',
  overflow: 'hidden',
  flexGrow: 1,
  pointerEvents: 'none',
  height: trackHeight,
  borderRadius: trackBorderRadius,

  // Pseudo-element for the variant's inset shadow / border. Owning it
  // here (rather than on the indicator) keeps the shadow above the fill
  // and pinned to the track edge.
  '::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    pointerEvents: 'none',
  },
});

// --- Size ---
//
// Heights mirror Radix's 4 / 6 / 8px (at default scaling) — `space[1]`
// is 4px, `space[2]` is 8px, and the size-2 step lands between via the
// `0.75` factor that Radix also uses.
export const size = styleVariants({
  1: { vars: { [trackHeight]: space[1] } },
  2: { vars: { [trackHeight]: `calc(${space[2]} * 0.75)` } },
  3: { vars: { [trackHeight]: space[2] } },
});

// --- Radius ---
//
// `full` matches Radix's pill default. Smaller steps ride the shared
// radius scale; `none` lets a square track through.
export const radius = styleVariants({
  none: { vars: { [trackBorderRadius]: '0' } },
  small: { vars: { [trackBorderRadius]: radiusToken[1] } },
  medium: { vars: { [trackBorderRadius]: radiusToken[2] } },
  large: { vars: { [trackBorderRadius]: radiusToken[3] } },
  full: { vars: { [trackBorderRadius]: radiusToken.full } },
});

// --- Color ---
//
// Each color binds the palette refs the rest of the stylesheet reads.
// `track` paints surface/classic indicators; `alpha[5]` overlays the
// soft variant's translucent fill; `solid[8]` is the soft indicator's
// opaque base; `solid[5]` and `solid[7]` drive the indeterminate
// fade/pulse keyframes so the animation stays inside the active
// palette.

export const color = styleVariants({
  accent: {
    vars: {
      [colorTrack]: accent.track,
      [colorAlpha5]: accent.alpha[5],
      [colorSolid5]: accent.solid[5],
      [colorSolid7]: accent.solid[7],
      [colorSolid8]: accent.solid[8],
    },
  },
  neutral: {
    vars: {
      [colorTrack]: neutral.track,
      [colorAlpha5]: neutral.alpha[5],
      [colorSolid5]: neutral.solid[5],
      [colorSolid7]: neutral.solid[7],
      [colorSolid8]: neutral.solid[8],
    },
  },
  danger: {
    vars: {
      [colorTrack]: danger.track,
      [colorAlpha5]: danger.alpha[5],
      [colorSolid5]: danger.solid[5],
      [colorSolid7]: danger.solid[7],
      [colorSolid8]: danger.solid[8],
    },
  },
  warning: {
    vars: {
      [colorTrack]: warning.track,
      [colorAlpha5]: warning.alpha[5],
      [colorSolid5]: warning.solid[5],
      [colorSolid7]: warning.solid[7],
      [colorSolid8]: warning.solid[8],
    },
  },
  success: {
    vars: {
      [colorTrack]: success.track,
      [colorAlpha5]: success.alpha[5],
      [colorSolid5]: success.solid[5],
      [colorSolid7]: success.solid[7],
      [colorSolid8]: success.solid[8],
    },
  },
});

// --- Variant ---
//
// Each variant paints the track and binds `fadeAnimation` /
// `pulseAnimation` so the indicator's animation-name list below
// resolves to the right pair. Indicator-side rules live on the
// indicator block — vanilla-extract requires each style to own its
// own selectors.

export const variant = styleVariants({
  surface: {
    backgroundColor: neutral.alpha[3],
    vars: {
      [fadeAnimation]: surfaceFade,
      [pulseAnimation]: surfacePulse,
    },
    selectors: {
      '&::after': {
        boxShadow: `inset 0 0 0 1px ${neutral.alpha[4]}`,
      },
    },
  },

  classic: {
    backgroundColor: neutral.alpha[3],
    vars: {
      [fadeAnimation]: surfaceFade,
      [pulseAnimation]: surfacePulse,
    },
    selectors: {
      '&::after': {
        boxShadow: shadow[1],
      },
    },
  },

  // Soft uses an alpha-blended fill so the bar sits inside the muted
  // track instead of on top of it. The white.step1 tint matches Radix's
  // dark-mode legibility trick.
  soft: {
    backgroundColor: neutral.alpha[4],
    backgroundImage: `linear-gradient(${white.step1}, ${white.step1})`,
    vars: {
      [fadeAnimation]: softFade,
      [pulseAnimation]: softPulse,
    },
  },
});

// --- Indicator (the fill) ---
//
// The indicator's per-variant fill rules reach back up to the variant
// class on the parent root. Putting them inside the variant block
// would target a sibling class — vanilla-extract requires each style
// to own its own selectors.

export const indicator = style({
  display: 'block',
  position: 'relative',
  height: '100%',
  width: '100%',
  transformOrigin: 'left center',
  transitionProperty: 'transform',
  transitionTimingFunction: standard.productive,
  transitionDuration: moderate[1],

  selectors: {
    [`${variant.surface} &`]: {
      backgroundColor: colorTrack,
    },
    [`${variant.classic} &`]: {
      backgroundColor: colorTrack,
    },
    [`${variant.soft} &`]: {
      backgroundColor: colorSolid8,
      backgroundImage: `linear-gradient(${colorAlpha5}, ${colorAlpha5})`,
    },
  },
});

// Determinate state: the component supplies inline
// `transform: scaleX(value/max)`. No animation needed.
//
// Indeterminate state: the indicator runs three animations in sequence
// (grow → fade once → pulse forever) plus a shine sweep on `::after`.
// Delays are expressed against `--progress-duration` so the user-set
// duration only stretches the first phase. The soft variant softens
// the shine — handled by the indicatorShine block below.
export const indicatorState = styleVariants({
  determinate: {},

  indeterminate: {
    animationName: `${grow}, ${fadeAnimation}, ${pulseAnimation}`,
    animationDelay: `0s, calc(${progressDurationCss} + 5s), calc(${progressDurationCss} + 7.5s)`,
    animationDuration: `${progressDurationCss}, ${FADE_DURATION}, ${PULSE_DURATION}`,
    animationIterationCount: '1, 1, infinite',
    animationFillMode: 'both, none, none',
    animationDirection: 'normal, normal, alternate',

    '::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      width: '400%',
      animationName: shine,
      animationDelay: `calc(${progressDurationCss} + 5s)`,
      animationDuration: SHINE_DURATION,
      animationFillMode: 'backwards',
      animationIterationCount: 'infinite',
      backgroundImage: `linear-gradient(to right, transparent 25%, ${shineGradient}, transparent 75%)`,
    },

    selectors: {
      // Soft variant's shine sits at 75% opacity so it doesn't blow
      // out the muted track. Selector targets the indicator's `::after`
      // when the parent root carries the soft variant class.
      [`${variant.soft} &::after`]: {
        opacity: 0.75,
      },
    },
  },
});
