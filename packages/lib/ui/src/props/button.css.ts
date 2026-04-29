import { createVar, style, styleVariants } from '@vanilla-extract/css';
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
  1: {
    ...typeScaleProps(1),
    height: space[5],
    minWidth: space[5],
    paddingInline: space[2],
    gap: space[1],
    borderRadius: radius[1],
  },
  2: {
    ...typeScaleProps(2),
    height: space[6],
    minWidth: space[6],
    paddingInline: space[3],
    gap: space[1],
    borderRadius: radius[2],
  },
  3: {
    ...typeScaleProps(3),
    height: space[7],
    minWidth: space[7],
    paddingInline: space[4],
    gap: space[2],
    borderRadius: radius[3],
  },
  4: {
    ...typeScaleProps(4),
    height: space[8],
    minWidth: space[8],
    paddingInline: space[5],
    gap: space[2],
    borderRadius: radius[4],
  },
} as const;

export const size = styleVariants(
  Object.fromEntries(sizes.map((key) => [key, sizeMap[key]])) as Record<
    (typeof sizes)[number],
    (typeof sizeMap)[1]
  >,
);

const iconSizeMap = {
  1: {
    ...typeScaleProps(1),
    width: space[5],
    height: space[5],
    borderRadius: radius[1],
  },
  2: {
    ...typeScaleProps(2),
    width: space[6],
    height: space[6],
    borderRadius: radius[2],
  },
  3: {
    ...typeScaleProps(3),
    width: space[7],
    height: space[7],
    borderRadius: radius[3],
  },
  4: {
    ...typeScaleProps(4),
    width: space[8],
    height: space[8],
    borderRadius: radius[4],
  },
} as const;

export const iconSize = styleVariants(
  Object.fromEntries(sizes.map((key) => [key, iconSizeMap[key]])) as Record<
    (typeof sizes)[number],
    (typeof iconSizeMap)[1]
  >,
);

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
    boxShadow: `inset 0 0 0 1px ${palette.alpha[7]}`,
    '@media': {
      '(hover: hover)': {
        selectors: {
          '&:hover:not(:disabled):not(:active)': {
            backgroundColor: palette.alpha[3],
            boxShadow: `inset 0 0 0 1px ${palette.alpha[8]}`,
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

const surfaceStyle = (color: ColorName) => {
  const palette = colorScales[color];

  return style({
    backgroundColor: palette.surface,
    color: palette.alpha[11],
    boxShadow: `inset 0 0 0 1px ${palette.alpha[7]}`,
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
