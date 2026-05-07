/**
 * Base styles shared by Tabs and TabNav.
 *
 * `TabsList` / `TabNavRoot` render the `list`; their child triggers/links
 * render the `trigger` plus a `triggerInner` span (visible, absolutely
 * positioned) and a `triggerInnerHidden` sibling (in-flow, `visibility:
 * hidden`) that always paints active typography. The hidden sibling
 * pre-reserves the trigger's width using the active state's metrics so
 * activating/deactivating doesn't reflow the row.
 *
 * The active state applies `triggerActive`; the indicator color is fed
 * in via `--tab-active-indicator` set by the `color` variants on the
 * list. Inner padding is fed in via per-size custom properties so the
 * variants on the parent list reach the inner span without nested-class
 * selectors.
 *
 * Active typography matches Radix verbatim: medium font-weight and a
 * `-0.01em` letter-spacing tightening. The dual-span trick is the only
 * thing that keeps the weight delta from causing a width flicker.
 */

import { createVar, style, styleVariants } from '@vanilla-extract/css';
import {
  accent,
  fontFamily,
  fontWeight,
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
        '&:where(:not(:disabled):hover)': {
          color: neutral.solid[12],
        },
      },
    },
  },
});

// Active-state typography deltas. Radix carries these as
// `--tab-active-letter-spacing` (-0.01em) and `--tab-active-word-spacing`
// (0em); inactive resets both to 0em. Word-spacing is a no-op since
// inactive is also 0em — only letter-spacing visibly shifts.
const activeLetterSpacing = '-0.01em';
const inactiveLetterSpacing = '0em';

/**
 * Inner span carrying the hover/focus rounded surface. Absolutely
 * positioned so it overlays — but does not size — the trigger. The
 * sibling `triggerInnerHidden` reserves the trigger's intrinsic width
 * using the active state's metrics, keeping width stable across the
 * inactive ↔ active flip.
 */
export const triggerInner = style({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: innerBorderRadius,
  paddingLeft: innerPaddingX,
  paddingRight: innerPaddingX,
  paddingTop: innerPaddingY,
  paddingBottom: innerPaddingY,
  letterSpacing: inactiveLetterSpacing,

  selectors: {
    // Active typography: medium weight + tightened tracking.
    [`${trigger}:where([data-state='active'], [data-active]) &`]: {
      fontWeight: fontWeight.medium,
      letterSpacing: activeLetterSpacing,
    },
    [`${trigger}:where(:focus-visible) &`]: {
      outline: `2px solid ${accent.solid[8]}`,
      outlineOffset: '-2px',
    },
  },

  '@media': {
    '(hover: hover)': {
      selectors: {
        // Specificity must equal the focus-visible:hover rule below so
        // source order decides the winner — keep `:hover` inside `:where()`.
        [`${trigger}:where(:not(:disabled):hover) &`]: {
          backgroundColor: neutral.alpha[3],
        },
        [`${trigger}:where(:focus-visible:hover) &`]: {
          backgroundColor: accent.alpha[3],
        },
      },
    },
  },
});

/**
 * Width-reserving sibling. Always renders the trigger's content with
 * the active typography (medium weight, tightened tracking) and stays
 * `visibility: hidden` so it never paints. The trigger's flex container
 * sizes itself from this sibling, which is why activating the trigger
 * doesn't change its width.
 */
export const triggerInnerHidden = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  visibility: 'hidden',
  paddingLeft: innerPaddingX,
  paddingRight: innerPaddingX,
  paddingTop: innerPaddingY,
  paddingBottom: innerPaddingY,
  fontWeight: fontWeight.medium,
  letterSpacing: activeLetterSpacing,
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
