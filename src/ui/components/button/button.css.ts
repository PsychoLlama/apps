import { style, styleVariants } from '@vanilla-extract/css';
import {
  accent,
  background,
  danger,
  fontFamily,
  fontWeight,
  neutral,
  radius,
  space,
  typeScale,
  white,
} from '#design';

export const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',

  fontFamily: fontFamily.body,
  fontWeight: fontWeight.medium,
  flexShrink: 0,
  transitionProperty: 'background-color, color, box-shadow',
  transitionDuration: '120ms',
  transitionTimingFunction: 'ease',

  ':disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },

  ':focus-visible': {
    outline: `2px solid ${accent[8]}`,
    outlineOffset: '2px',
  },
});

const sizes = [1, 2, 3, 4] as const;

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
  Object.fromEntries(sizes.map((s) => [s, sizeMap[s]])) as Record<
    (typeof sizes)[number],
    (typeof sizeMap)[1]
  >,
);

function typeScaleProps(step: 1 | 2 | 3 | 4) {
  return {
    fontSize: typeScale[step].fontSize,
    lineHeight: typeScale[step].lineHeight,
    letterSpacing: typeScale[step].letterSpacing,
  };
}

// --- Variant x Color matrix ---

const colorScales = { accent, neutral, danger } as const;
type ColorName = keyof typeof colorScales;

function solidStyle(color: ColorName) {
  const scale = colorScales[color];
  const textColor = color === 'neutral' ? background.page : white[12];

  return style({
    backgroundColor: scale[9],
    color: textColor,
    '@media': {
      '(hover: hover)': {
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: scale[10],
          },
        },
      },
    },
    selectors: {
      '&:active:not(:disabled)': {
        backgroundColor: scale[10],
      },
    },
  });
}

function softStyle(color: ColorName) {
  const scale = colorScales[color];

  return style({
    backgroundColor: scale[3],
    color: scale[11],
    '@media': {
      '(hover: hover)': {
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: scale[4],
          },
        },
      },
    },
    selectors: {
      '&:active:not(:disabled)': {
        backgroundColor: scale[5],
      },
    },
  });
}

function outlineStyle(color: ColorName) {
  const scale = colorScales[color];

  return style({
    backgroundColor: 'transparent',
    color: scale[11],
    boxShadow: `inset 0 0 0 1px ${scale[7]}`,
    '@media': {
      '(hover: hover)': {
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: scale[3],
            boxShadow: `inset 0 0 0 1px ${scale[8]}`,
          },
        },
      },
    },
    selectors: {
      '&:active:not(:disabled)': {
        backgroundColor: scale[4],
      },
    },
  });
}

function ghostStyle(color: ColorName) {
  const scale = colorScales[color];

  return style({
    backgroundColor: 'transparent',
    color: scale[11],
    '@media': {
      '(hover: hover)': {
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: scale[3],
          },
        },
      },
    },
    selectors: {
      '&:active:not(:disabled)': {
        backgroundColor: scale[4],
      },
    },
  });
}

export const variantColor = {
  solid: {
    accent: solidStyle('accent'),
    neutral: solidStyle('neutral'),
    danger: solidStyle('danger'),
  },
  soft: {
    accent: softStyle('accent'),
    neutral: softStyle('neutral'),
    danger: softStyle('danger'),
  },
  outline: {
    accent: outlineStyle('accent'),
    neutral: outlineStyle('neutral'),
    danger: outlineStyle('danger'),
  },
  ghost: {
    accent: ghostStyle('accent'),
    neutral: ghostStyle('neutral'),
    danger: ghostStyle('danger'),
  },
} as const;
