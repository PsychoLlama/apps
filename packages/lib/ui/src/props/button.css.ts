/**
 * Shared button style primitives consumed by Button, IconButton, and
 * LinkButton.
 *
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/_internal/base-button.css
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/button.css
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/icon-button.css
 */

import {
  createVar,
  globalStyle,
  style,
  styleVariants,
} from '@vanilla-extract/css';
import {
  marginTopOverride,
  marginRightOverride,
  marginBottomOverride,
  marginLeftOverride,
  userMarginTop,
  userMarginRight,
  userMarginBottom,
  userMarginLeft,
} from './margin.css';
import {
  accent,
  danger,
  fast,
  fontFamily,
  fontWeight,
  neutral,
  radius,
  space,
  standard,
  success,
  typeScale,
  warning,
} from '@lib/design';
import { assignColorSchemeVars } from '@lib/design/color-scheme';

export const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',

  fontFamily: fontFamily.body,
  fontWeight: fontWeight.medium,
  flexShrink: 0,
  transitionProperty: 'background-color, color, box-shadow, filter',
  transitionDuration: fast[2],
  transitionTimingFunction: standard.productive,

  ':disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },

  ':focus-visible': {
    outline: `2px solid ${accent.solid[8]}`,
    outlineOffset: '2px',
  },
});

/**
 * CSS filter applied on :active for solid-variant buttons. Light mode
 * darkens slightly; dark mode brightens. Scoped to the button so the
 * var only exists when the component is used.
 */
const solidActiveFilter = createVar();

assignColorSchemeVars(
  { [solidActiveFilter]: 'brightness(0.92) saturate(1.1)' },
  { [solidActiveFilter]: 'brightness(1.08)' },
);

const sizes = [1, 2, 3, 4] as const;

const typeScaleProps = (step: 1 | 2 | 3 | 4) => {
  return {
    fontSize: typeScale[step].fontSize,
    lineHeight: typeScale[step].lineHeight,
    letterSpacing: typeScale[step].letterSpacing,
  };
};

const sizeMap = {
  1: { ...typeScaleProps(1), gap: space[1], borderRadius: radius[1] },
  2: { ...typeScaleProps(2), gap: space[1], borderRadius: radius[2] },
  3: { ...typeScaleProps(3), gap: space[2], borderRadius: radius[3] },
  4: { ...typeScaleProps(4), gap: space[2], borderRadius: radius[4] },
} as const;

/** Per-size typescale, gap, and default border radius — applied to every variant. */
export const size = styleVariants(
  Object.fromEntries(sizes.map((key) => [key, sizeMap[key]])) as Record<
    (typeof sizes)[number],
    (typeof sizeMap)[1]
  >,
);

// --- Non-ghost dimensional rules ---

const buttonNonGhostSizeMap = {
  1: { height: space[5], minWidth: space[5], paddingInline: space[2] },
  2: { height: space[6], minWidth: space[6], paddingInline: space[3] },
  3: { height: space[7], minWidth: space[7], paddingInline: space[4] },
  4: { height: space[8], minWidth: space[8], paddingInline: space[5] },
} as const;

/** Fixed height + horizontal padding for non-ghost text Button. */
export const buttonNonGhostSize = styleVariants(
  Object.fromEntries(
    sizes.map((key) => [key, buttonNonGhostSizeMap[key]]),
  ) as Record<(typeof sizes)[number], (typeof buttonNonGhostSizeMap)[1]>,
);

const iconButtonNonGhostSizeMap = {
  1: { width: space[5], height: space[5] },
  2: { width: space[6], height: space[6] },
  3: { width: space[7], height: space[7] },
  4: { width: space[8], height: space[8] },
} as const;

/** Square dimensions for non-ghost IconButton. */
export const iconButtonNonGhostSize = styleVariants(
  Object.fromEntries(
    sizes.map((key) => [key, iconButtonNonGhostSizeMap[key]]),
  ) as Record<(typeof sizes)[number], (typeof iconButtonNonGhostSizeMap)[1]>,
);

// --- Ghost dimensional rules ---
//
// Ghost variants drop the fixed height and replace it with padding so
// the hover background and focus ring extend past the visual content.
// The override-margin vars from `margin.css.ts` resolve to
// `calc(userMargin - ghostPadding)`, so the layout box retracts to the
// content edge while still composing with any caller-supplied
// `m`/`mx`/`my`. A direct-child reset on `--margin-{side}-override`
// stops the parent's calc'd value from cascading into nested
// margin-aware components — same defense Radix uses.
//
// Half-step values (`calc(${space[1]} * 1.5)`) come straight from
// Radix's button.css/icon-button.css — they fall between our scale
// steps to keep the ghost variant's progression smooth.

const buttonGhostSizeMap = {
  1: { paddingBlock: space[1], paddingInline: space[2] },
  2: { paddingBlock: space[1], paddingInline: space[2] },
  3: { paddingBlock: `calc(${space[1]} * 1.5)`, paddingInline: space[3] },
  4: { paddingBlock: space[2], paddingInline: space[4] },
} as const;

export const buttonGhostSize = styleVariants(
  buttonGhostSizeMap,
  ({ paddingBlock, paddingInline }) => ({
    paddingBlock,
    paddingInline,
    height: 'fit-content',
    vars: {
      [marginTopOverride]: `calc(${userMarginTop} - ${paddingBlock})`,
      [marginRightOverride]: `calc(${userMarginRight} - ${paddingInline})`,
      [marginBottomOverride]: `calc(${userMarginBottom} - ${paddingBlock})`,
      [marginLeftOverride]: `calc(${userMarginLeft} - ${paddingInline})`,
    },
  }),
);

const iconButtonGhostSizeMap = {
  1: space[1],
  2: `calc(${space[1]} * 1.5)`,
  3: space[2],
  4: space[3],
} as const;

export const iconButtonGhostSize = styleVariants(
  iconButtonGhostSizeMap,
  (padding) => ({
    padding,
    height: 'fit-content',
    vars: {
      [marginTopOverride]: `calc(${userMarginTop} - ${padding})`,
      [marginRightOverride]: `calc(${userMarginRight} - ${padding})`,
      [marginBottomOverride]: `calc(${userMarginBottom} - ${padding})`,
      [marginLeftOverride]: `calc(${userMarginLeft} - ${padding})`,
    },
  }),
);

// Setting a custom property to `initial` resolves it to the
// guaranteed-invalid value, which makes `var(--x, fallback)` use the
// fallback. The reset cascades through wrappers so descendants at any
// depth fall back to their own user margin var.
const overrideReset = {
  [marginTopOverride]: 'initial',
  [marginRightOverride]: 'initial',
  [marginBottomOverride]: 'initial',
  [marginLeftOverride]: 'initial',
};

sizes.forEach((key) => {
  globalStyle(`.${buttonGhostSize[key]} > *`, { vars: overrideReset });
  globalStyle(`.${iconButtonGhostSize[key]} > *`, { vars: overrideReset });
});

// --- Radius override ---

// Declared after the size variants so the `borderRadius` rule wins on
// equal specificity when both are present in the class list.
export const cornerRadius = styleVariants({
  // `unset` resolves to the initial value (0) — used instead of a
  // hard-coded `0` so the design-token lint rule stays happy.
  none: { borderRadius: 'unset' },
  small: { borderRadius: radius[1] },
  medium: { borderRadius: radius[2] },
  large: { borderRadius: radius[3] },
  full: { borderRadius: radius.full },
});

// --- Variant x Color matrix ---

const colorScales = { accent, neutral, danger, warning, success } as const;
type ColorName = keyof typeof colorScales;

const solidStyle = (color: ColorName) => {
  const palette = colorScales[color];

  return style({
    backgroundColor: palette.solid[9],
    color: palette.contrast,
    '@media': {
      '(hover: hover)': {
        selectors: {
          '&:hover:not(:disabled):not(:active)': {
            backgroundColor: palette.solid[10],
          },
        },
      },
    },
    selectors: {
      '&:active:not(:disabled)': {
        backgroundColor: palette.solid[10],
        filter: solidActiveFilter,
      },
    },
  });
};

const softStyle = (color: ColorName) => {
  const palette = colorScales[color];

  return style({
    backgroundColor: palette.alpha[3],
    color: palette.alpha[11],
    ':focus-visible': {
      outlineOffset: '-1px',
    },
    '@media': {
      '(hover: hover)': {
        selectors: {
          '&:hover:not(:disabled):not(:active)': {
            backgroundColor: palette.alpha[4],
          },
        },
      },
    },
    selectors: {
      '&:active:not(:disabled)': {
        backgroundColor: palette.alpha[5],
      },
    },
  });
};

const outlineStyle = (color: ColorName) => {
  const palette = colorScales[color];

  return style({
    backgroundColor: 'transparent',
    color: palette.alpha[11],
    boxShadow: `inset 0 0 0 1px ${palette.alpha[8]}`,
    ':focus-visible': {
      outlineOffset: '-1px',
    },
    '@media': {
      '(hover: hover)': {
        selectors: {
          '&:hover:not(:disabled):not(:active)': {
            backgroundColor: palette.alpha[2],
          },
        },
      },
    },
    selectors: {
      '&:active:not(:disabled)': {
        backgroundColor: palette.alpha[3],
      },
    },
  });
};

const surfaceStyle = (color: ColorName) => {
  const palette = colorScales[color];

  return style({
    backgroundColor: palette.surface,
    color: palette.alpha[11],
    boxShadow: `inset 0 0 0 1px ${palette.alpha[7]}`,
    ':focus-visible': {
      outlineOffset: '-1px',
    },
    '@media': {
      '(hover: hover)': {
        selectors: {
          '&:hover:not(:disabled):not(:active)': {
            boxShadow: `inset 0 0 0 1px ${palette.alpha[8]}`,
          },
        },
      },
    },
    selectors: {
      '&:active:not(:disabled)': {
        backgroundColor: palette.alpha[3],
        boxShadow: `inset 0 0 0 1px ${palette.alpha[8]}`,
      },
    },
  });
};

const ghostStyle = (color: ColorName) => {
  const palette = colorScales[color];

  return style({
    backgroundColor: 'transparent',
    color: palette.alpha[11],
    ':focus-visible': {
      outlineOffset: '-1px',
    },
    '@media': {
      '(hover: hover)': {
        selectors: {
          '&:hover:not(:disabled):not(:active)': {
            backgroundColor: palette.alpha[3],
          },
        },
      },
    },
    selectors: {
      '&:active:not(:disabled)': {
        backgroundColor: palette.alpha[4],
      },
    },
  });
};

export const variantColor = {
  solid: {
    accent: solidStyle('accent'),
    neutral: solidStyle('neutral'),
    danger: solidStyle('danger'),
    warning: solidStyle('warning'),
    success: solidStyle('success'),
  },
  soft: {
    accent: softStyle('accent'),
    neutral: softStyle('neutral'),
    danger: softStyle('danger'),
    warning: softStyle('warning'),
    success: softStyle('success'),
  },
  surface: {
    accent: surfaceStyle('accent'),
    neutral: surfaceStyle('neutral'),
    danger: surfaceStyle('danger'),
    warning: surfaceStyle('warning'),
    success: surfaceStyle('success'),
  },
  outline: {
    accent: outlineStyle('accent'),
    neutral: outlineStyle('neutral'),
    danger: outlineStyle('danger'),
    warning: outlineStyle('warning'),
    success: outlineStyle('success'),
  },
  ghost: {
    accent: ghostStyle('accent'),
    neutral: ghostStyle('neutral'),
    danger: ghostStyle('danger'),
    warning: ghostStyle('warning'),
    success: ghostStyle('success'),
  },
} as const;
