/**
 * Base styles shared by Tabs and TabNav.
 *
 * Tabs.List / TabNav.Root render the `list`; their child triggers/links
 * render the `trigger` plus the dual-span inner pair. The active state
 * applies `triggerActive`; the indicator color is fed in via the
 * `--tab-active-indicator` custom property assigned by the `color`
 * variants on the list. Inner padding is fed in via per-size custom
 * properties so the variants on the parent list reach inner spans
 * without needing nested-class selectors.
 */

import { createVar, style, styleVariants } from '@vanilla-extract/css';
import {
  accent,
  fast,
  fontFamily,
  fontWeight,
  neutral,
  radius,
  space,
  standard,
  typeScale,
} from '@lib/design';

/** Set on the list element by the `color` variants; read by `triggerActive`. */
export const activeIndicator = createVar();
/** Set on the list element by the `size` variants; read by `triggerInner`/`triggerInnerHidden`. */
export const innerPaddingX = createVar();
/** Set on the list element by the `size` variants; read by `triggerInner`/`triggerInnerHidden`. */
export const innerPaddingY = createVar();

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
  alignItems: 'stretch',
  justifyContent: 'center',
  flexShrink: 0,
  fontFamily: fontFamily.body,
  color: neutral.solid[11],
  cursor: 'pointer',
  userSelect: 'none',
  background: 'none',
  transitionProperty: 'color',
  transitionDuration: fast[2],
  transitionTimingFunction: standard.productive,

  selectors: {
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
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

/** Visible inner span. Inherits color/weight from the trigger. */
export const triggerInner = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radius[1],
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
      },
    },
  },
});

/**
 * Hidden mirror of the inner span, always rendered at the active weight,
 * so the trigger's intrinsic width never shifts when activating. Held in
 * place by `visibility: hidden` and `aria-hidden` on the element itself.
 */
export const triggerInnerHidden = style({
  display: 'inline-block',
  visibility: 'hidden',
  height: 0,
  fontWeight: fontWeight.medium,
  paddingLeft: innerPaddingX,
  paddingRight: innerPaddingX,
});

/** Applied when the trigger represents the active tab/link. */
export const triggerActive = style({
  color: neutral.solid[12],
  fontWeight: fontWeight.medium,

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

const sizeStyle = (
  innerPx: keyof typeof space,
  innerPy: keyof typeof space,
  outerPx: keyof typeof space,
  height: keyof typeof space,
  step: keyof typeof typeScale,
) => ({
  height: space[height],
  fontSize: typeScale[step].fontSize,
  lineHeight: typeScale[step].lineHeight,
  letterSpacing: typeScale[step].letterSpacing,
  paddingLeft: space[outerPx],
  paddingRight: space[outerPx],
  vars: {
    [innerPaddingX]: space[innerPx],
    [innerPaddingY]: space[innerPy],
  },
});

export const size = styleVariants({
  1: sizeStyle(2, 1, 2, 6, 1),
  2: sizeStyle(3, 2, 3, 7, 2),
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
