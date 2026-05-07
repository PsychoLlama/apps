import { fallbackVar, style, styleVariants } from '@vanilla-extract/css';
import { fontFamily, typeScale } from '@lib/design';
import { letterSpacing, lineHeight } from '../../vars/typography.css';

export { weight, align, color } from '../text/text.css';

export const base = style({
  fontFamily: fontFamily.heading,
  lineHeight: fallbackVar(lineHeight, 'inherit'),
  letterSpacing: fallbackVar(letterSpacing, 'inherit'),
});

const steps = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

// Heading reuses Text's font-size and letter-spacing per step but swaps
// in the heading-specific line-height. Mirrors Radix's
// `--heading-line-height-N` override pattern.
export const size = styleVariants(
  Object.fromEntries(
    steps.map((step) => [
      step,
      {
        fontSize: typeScale[step].fontSize,
        vars: {
          [lineHeight]: typeScale[step].headingLineHeight,
          [letterSpacing]: typeScale[step].letterSpacing,
        },
      },
    ]),
  ) as Record<
    (typeof steps)[number],
    {
      fontSize: string;
      vars: Record<string, string>;
    }
  >,
);
