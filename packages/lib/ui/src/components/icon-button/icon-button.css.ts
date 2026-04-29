/**
 * IconButton styles. Reuses {@link Button}'s base reset and variant×color
 * matrix, swapping in a square-shaped size matrix (no inline padding).
 *
 * Ported from Radix UI Themes IconButton. Deviations:
 * - Ghost variant keeps the square footprint instead of expanding via
 *   padding + negative-margin compensation. Our margin system is
 *   class-based, not CSS-variable-based, so the Radix trick doesn't fit
 *   cleanly. Hit target equals visual size at every variant.
 *
 * @see https://www.radix-ui.com/themes/docs/components/icon-button
 */

import { styleVariants } from '@vanilla-extract/css';
import { radius, space, typeScale } from '@lib/design';

const typeScaleProps = (step: 1 | 2 | 3 | 4) => ({
  fontSize: typeScale[step].fontSize,
  lineHeight: typeScale[step].lineHeight,
  letterSpacing: typeScale[step].letterSpacing,
});

export const size = styleVariants({
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
});
