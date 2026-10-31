/**
 * Enter and exit motion for a floating window that opens off a trigger,
 * shared by `Popover` and `DropdownMenu`. Mirrors Radix Themes' shared
 * popper animation; the deviations are recorded on `Popover`.
 */

import { createVar, keyframes, style } from '@vanilla-extract/css';
import { entrance, exit, fast, moderate, space } from '@lib/design';

// Which way the window travels: out of the trigger on the way in, back
// toward it on the way out. Both stay at zero until `data-side` says
// which axis faces it.
const slideX = createVar();
const slideY = createVar();

/** Tucked against the trigger: where the window arrives from and leaves to. */
const TUCKED = {
  opacity: 0,
  transform: `translate(${slideX}, ${slideY}) scale(0.97)`,
};

const enter = keyframes({ from: TUCKED });
const leave = keyframes({ to: TUCKED });

/**
 * The positioned box, which carries the motion so the surface and its
 * shadow travel together, out of the `transform-origin` the window
 * already points at the trigger. `data-state` comes from presence,
 * which holds the box mounted until the exit settles.
 */
export const window = style({
  vars: { [slideX]: '0px', [slideY]: '0px' },
  selectors: {
    '&:where([data-state="open"])': {
      animation: `${enter} ${moderate[1]} ${entrance.productive}`,
    },
    '&:where([data-state="closed"])': {
      animation: `${leave} ${fast[2]} ${exit.productive} forwards`,
    },

    // `data-side` is the resolved side, so a window that flipped slides
    // along the side it actually landed on.
    '&:where([data-side="top"])': { vars: { [slideY]: space[1] } },
    '&:where([data-side="bottom"])': {
      vars: { [slideY]: `calc(-1 * ${space[1]})` },
    },
    '&:where([data-side="left"])': { vars: { [slideX]: space[1] } },
    '&:where([data-side="right"])': {
      vars: { [slideX]: `calc(-1 * ${space[1]})` },
    },
  },
});
