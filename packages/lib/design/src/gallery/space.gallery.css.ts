import { createVar, style } from '@vanilla-extract/css';
import { neutral, space } from '@lib/design';

/** Spacing step the measure line spans, supplied per cell via `assignInlineVars`. */
export const spaceVar = createVar();

/**
 * A dimension line the width of the spacing step (via {@link spaceVar}): two end
 * ticks bridged by a rule. At the smallest steps the rule collapses to nothing
 * and the ticks meet — an honest read of how little space that is.
 */
export const measure = style({
  display: 'flex',
  alignItems: 'center',
  width: spaceVar,
  height: space[3],
});

/** End cap pinning one edge of the measured span. */
export const tick = style({
  flexShrink: 0,
  width: '2px',
  height: '100%',
  backgroundColor: neutral.solid[9],
});

/** Hairline bridging the two ticks; shrinks to nothing at the smallest steps. */
export const rule = style({
  flex: 1,
  minWidth: 0,
  height: '2px',
  backgroundColor: neutral.solid[9],
});
