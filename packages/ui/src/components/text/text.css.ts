import { style, styleVariants } from '@vanilla-extract/css';
import { typeScale, fontFamily, fontWeight, text } from '@psychollama/design';

export const base = style({
  fontFamily: fontFamily.body,
});

const steps = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const size = styleVariants(
  Object.fromEntries(
    steps.map((step) => [
      step,
      {
        fontSize: typeScale[step].fontSize,
        lineHeight: typeScale[step].lineHeight,
        letterSpacing: typeScale[step].letterSpacing,
      },
    ]),
  ) as Record<
    (typeof steps)[number],
    { fontSize: string; lineHeight: string; letterSpacing: string }
  >,
);

export const weight = styleVariants({
  light: { fontWeight: fontWeight.light },
  regular: { fontWeight: fontWeight.regular },
  medium: { fontWeight: fontWeight.medium },
  bold: { fontWeight: fontWeight.bold },
});

export const align = styleVariants({
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
});

export const color = styleVariants({
  highContrast: { color: text.highContrast },
  lowContrast: { color: text.lowContrast },
});
