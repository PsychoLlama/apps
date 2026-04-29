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
import { marginBlockOffset, marginInlineOffset } from './margin.css';
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
  verticalAlign: 'top',

  fontFamily: fontFamily.body,
  fontWeight: fontWeight.medium,
  flexShrink: 0,
  transitionProperty: 'background-color, color, box-shadow, filter',
  transitionDuration: fast[2],
  transitionTimingFunction: standard.productive,

  ':disabled': {
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
export const size = styleVariants(sizeMap);

// --- Non-ghost dimensional rules ---

// Non-ghost gaps are larger than the ghost values from `sizeMap`
// (Radix scales gap up for non-ghost; ghost stays compact for inline use).
const buttonNonGhostSizeMap = {
  1: {
    height: space[5],
    minWidth: space[5],
    paddingInline: space[2],
    gap: space[1],
  },
  2: {
    height: space[6],
    minWidth: space[6],
    paddingInline: space[3],
    gap: space[2],
  },
  3: {
    height: space[7],
    minWidth: space[7],
    paddingInline: space[4],
    gap: space[3],
  },
  4: {
    height: space[8],
    minWidth: space[8],
    paddingInline: space[5],
    gap: space[3],
  },
} as const;

/** Fixed height + horizontal padding + non-ghost gap for text Button. */
export const buttonNonGhostSize = styleVariants(buttonNonGhostSizeMap);

/**
 * Non-ghost Button SVG children render at 90% opacity to soften the
 * inline icon against the label. Ghost has no equivalent — Radix omits
 * it because ghost foreground colors are already alpha-blended.
 *
 * `globalStyle` is required because vanilla-extract's `selectors`
 * field forbids descending past `&`.
 */
export const buttonNonGhostSvg = style({});

globalStyle(`.${buttonNonGhostSvg} :where(svg)`, { opacity: 0.9 });

const iconButtonNonGhostSizeMap = {
  1: { width: space[5], height: space[5] },
  2: { width: space[6], height: space[6] },
  3: { width: space[7], height: space[7] },
  4: { width: space[8], height: space[8] },
} as const;

/** Square dimensions for non-ghost IconButton. */
export const iconButtonNonGhostSize = styleVariants(iconButtonNonGhostSizeMap);

// --- Ghost dimensional rules ---
//
// Ghost variants drop the fixed height and replace it with padding so
// the hover background and focus ring extend past the visual content.
// They set `--margin-{side}-offset` to the padding so the user's
// margin (default 0) gets retracted by that amount in
// `calc(user - offset)`. With user margin = 0 the result is
// `-padding`; with user m={N} the result is `space[N] - padding`.
// `marginBase` re-declares the offset vars locally on every
// margin-aware element, so descendants are automatically isolated.
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
      [marginBlockOffset]: paddingBlock,
      [marginInlineOffset]: paddingInline,
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
      [marginBlockOffset]: padding,
      [marginInlineOffset]: padding,
    },
  }),
);

// --- Radius override ---

// Declared after the size variants so the `borderRadius` rule wins on
// equal specificity when both are present in the class list.
export const cornerRadius = styleVariants({
  // eslint-disable-next-line custom/require-design-tokens -- intentional zero radius; Radix exposes "none" as a theme-level preset, not a token in the scale.
  none: { borderRadius: 0 },
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
      // Larger translucent halo on touch :active gives a clear
      // tap-target affordance — no native :hover on coarse pointers.
      '(pointer: coarse)': {
        selectors: {
          '&:active:not(:disabled)': {
            outline: `0.5em solid ${palette.alpha[4]}`,
            outlineOffset: 0,
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
    // Soft is the only variant whose focus ring inherits the variant's
    // own color (Radix uses --accent-8 here, --focus-8 elsewhere).
    ':focus-visible': {
      outline: `2px solid ${palette.solid[8]}`,
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
    // Ghost reads as inline text — inherit the surrounding weight
    // rather than forcing the medium weight applied to other variants.
    fontWeight: 'inherit',
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

// --- Disabled state ---
//
// Per-variant `:disabled` rules. Color/background match Radix's gray
// disabled treatment regardless of the variant's own `color` prop, so
// these are factored per-variant (one rule × five variants) rather
// than per-color (one rule × five variants × five colors). Declared
// after `variantColor` so its `:disabled` selectors win the cascade.

const disabledColor = neutral.alpha[8];
const disabledBg = neutral.alpha[3];

const baseDisabled = {
  color: disabledColor,
  outline: 'none',
  filter: 'none',
};

export const variantDisabled = {
  solid: style({
    selectors: {
      '&:disabled': {
        ...baseDisabled,
        backgroundColor: disabledBg,
      },
    },
  }),
  soft: style({
    selectors: {
      '&:disabled': {
        ...baseDisabled,
        backgroundColor: disabledBg,
      },
    },
  }),
  surface: style({
    selectors: {
      '&:disabled': {
        ...baseDisabled,
        backgroundColor: neutral.alpha[2],
        boxShadow: `inset 0 0 0 1px ${neutral.alpha[6]}`,
      },
    },
  }),
  outline: style({
    selectors: {
      '&:disabled': {
        ...baseDisabled,
        backgroundColor: 'transparent',
        boxShadow: `inset 0 0 0 1px ${neutral.alpha[7]}`,
      },
    },
  }),
  ghost: style({
    selectors: {
      '&:disabled': {
        ...baseDisabled,
        backgroundColor: 'transparent',
      },
    },
  }),
} as const;
