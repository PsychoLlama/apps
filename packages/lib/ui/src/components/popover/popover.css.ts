/**
 * Popover styles.
 *
 * Ported from Radix UI Themes Popover. The surface is the floating
 * primitive's body, so padding and radius arrive as props there; what's
 * left here is the paint.
 *
 * Deviations from Radix:
 * - `--color-panel-solid` / `--shadow-5` map onto `background.panelSolid`
 *   / `shadow[5]`.
 * - No `min-width: var(--radix-popover-trigger-width)`. Deferred: the
 *   window shrink-wraps its surface, so the trigger's width has to be
 *   measured and handed down.
 * - No `--inset-padding-*` vars. Deferred: `Inset` only reads `Card`'s.
 * - Motion rides the scale, as `Dialog`'s does: `moderate[1]` in
 *   (upstream 160ms), `fast[2]` out (upstream 100ms), with
 *   `entrance.productive` / `exit.productive` in place of upstream's
 *   `cubic-bezier(0.16, 1, 0.3, 1)`. Reduced motion needs no media
 *   query; the duration tokens collapse on their own.
 * - One keyframe pair, aimed per side by a var, rather than a slide
 *   per side and direction. The slide is `space[1]` rather than 4px.
 *
 * @see https://www.radix-ui.com/themes/docs/components/popover
 */

import { createVar, keyframes, style } from '@vanilla-extract/css';
import {
  background,
  entrance,
  exit,
  fast,
  moderate,
  shadow,
  space,
} from '@lib/design';

/**
 * Any CSS width the surface wraps at. Assigned inline from the
 * `maxWidth` prop; the root defaults it to Themes' 480px.
 */
export const maxWidth = createVar();

/**
 * The floating root. Holds the var defaults, so every part inside reads
 * the same values.
 */
export const root = style({
  vars: { [maxWidth]: '480px' },
});

/** The surface. Padding and radius are props. */
export const content = style({
  backgroundColor: background.panelSolid,
  boxShadow: shadow[5],
  maxWidth: maxWidth,
  outline: 'none',
  overflow: 'auto',
});

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
