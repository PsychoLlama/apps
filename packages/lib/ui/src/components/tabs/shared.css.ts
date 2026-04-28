/**
 * Base styles shared by Tabs and TabNav.
 *
 * `TabsList` / `TabNavRoot` render the `list`; their child triggers/links
 * render the `trigger` plus a single `triggerInner` span that holds the
 * rounded hover/focus surface. The active state applies `triggerActive`;
 * the indicator color is fed in via `--tab-active-indicator` set by the
 * `color` variants on the list. Inner padding is fed in via per-size
 * custom properties so the variants on the parent list reach the inner
 * span without nested-class selectors.
 *
 * No font-weight or letter-spacing change between active and inactive —
 * IBM Plex Sans's weight delta makes the flicker too jarring, and color
 * + the bottom indicator already differentiate active state strongly.
 */

import { createVar, style, styleVariants } from '@vanilla-extract/css';
import {
  accent,
  fontFamily,
  neutral,
  radius,
  space,
  typeScale,
  type RadiusScale,
  type SpaceScale,
  type TypeScale,
} from '@lib/design';

/** Set on the list element by the `color` variants; read by `triggerActive`. */
export const activeIndicator = createVar();
/** Set on the list element by the `size` variants; read by `trigger`. */
export const outerPaddingX = createVar();
/** Set on the list element by the `size` variants; read by `triggerInner`. */
export const innerPaddingX = createVar();
/** Set on the list element by the `size` variants; read by `triggerInner`. */
export const innerPaddingY = createVar();
/** Set on the list element by the `size` variants; read by `triggerInner`. */
export const innerBorderRadius = createVar();

// --- List ---

export const list = style({
  display: 'flex',
  flexShrink: 0,
  position: 'relative',
  alignItems: 'stretch',
  overflowX: 'auto',
  scrollbarWidth: 'none',
  boxShadow: `inset 0 -1px 0 0 ${neutral.alpha[5]}`,
  selectors: {
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
});

// --- Trigger ---

export const trigger = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  fontFamily: fontFamily.body,
  color: neutral.alpha[11],
  cursor: 'pointer',
  userSelect: 'none',
  background: 'none',
  paddingLeft: outerPaddingX,
  paddingRight: outerPaddingX,

  selectors: {
    '&:disabled': {
      color: neutral.alpha[8],
      cursor: 'not-allowed',
    },
  },

  '@media': {
    '(hover: hover)': {
      selectors: {
        '&:where(:not(:disabled)):hover': {
          color: neutral.solid[12],
        },
      },
    },
  },
});

/**
 * Inner span. Carries the hover/focus rounded surface. Sized by intrinsic
 * content — no dual-span trick, since active and inactive share font weight
 * and letter-spacing.
 */
export const triggerInner = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: innerBorderRadius,
  paddingLeft: innerPaddingX,
  paddingRight: innerPaddingX,
  paddingTop: innerPaddingY,
  paddingBottom: innerPaddingY,

  selectors: {
    [`${trigger}:where(:focus-visible) &`]: {
      outline: `2px solid ${accent.solid[8]}`,
      outlineOffset: '-2px',
    },
  },

  '@media': {
    '(hover: hover)': {
      selectors: {
        [`${trigger}:where(:not(:disabled)):hover &`]: {
          backgroundColor: neutral.alpha[3],
        },
        [`${trigger}:where(:focus-visible:hover) &`]: {
          backgroundColor: accent.alpha[3],
        },
      },
    },
  },
});

/** Applied when the trigger represents the active tab/link. */
export const triggerActive = style({
  color: neutral.solid[12],

  selectors: {
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '2px',
      backgroundColor: activeIndicator,
    },
  },
});

// --- Size ---

// Radix's tab heights deliberately exceed the inner content's height
// so the hover/focus bg sits centered with breathing room above and
// below — for size 2 that's a 40px trigger holding a 28px inner.
const sizeStyle = (config: {
  outerPx: SpaceScale;
  innerPx: SpaceScale;
  /** CSS value (token or calc); size 1's inner-py is half of `space[1]`. */
  innerPy: string;
  innerRadius: RadiusScale;
  height: SpaceScale;
  step: TypeScale;
}) => ({
  height: space[config.height],
  fontSize: typeScale[config.step].fontSize,
  lineHeight: typeScale[config.step].lineHeight,
  letterSpacing: typeScale[config.step].letterSpacing,
  vars: {
    [outerPaddingX]: space[config.outerPx],
    [innerPaddingX]: space[config.innerPx],
    [innerPaddingY]: config.innerPy,
    [innerBorderRadius]: radius[config.innerRadius],
  },
});

export const size = styleVariants({
  1: sizeStyle({
    outerPx: 1,
    innerPx: 1,
    innerPy: `calc(${space[1]} * 0.5)`,
    innerRadius: 1,
    height: 6,
    step: 1,
  }),
  2: sizeStyle({
    outerPx: 2,
    innerPx: 2,
    innerPy: space[1],
    innerRadius: 2,
    height: 7,
    step: 2,
  }),
});

// --- Justify ---

export const justify = styleVariants({
  start: { justifyContent: 'flex-start' },
  center: { justifyContent: 'center' },
  end: { justifyContent: 'flex-end' },
});

// --- Wrap ---

export const wrap = styleVariants({
  nowrap: { flexWrap: 'nowrap' },
  wrap: { flexWrap: 'wrap' },
  'wrap-reverse': { flexWrap: 'wrap-reverse' },
});

// --- Color × highContrast ---

const colorStyle = (color: string) => ({
  vars: {
    [activeIndicator]: color,
  },
});

export const color = {
  accent: {
    normal: style(colorStyle(accent.solid[9])),
    high: style(colorStyle(accent.solid[12])),
  },
  neutral: {
    normal: style(colorStyle(neutral.solid[9])),
    high: style(colorStyle(neutral.solid[12])),
  },
} as const;
