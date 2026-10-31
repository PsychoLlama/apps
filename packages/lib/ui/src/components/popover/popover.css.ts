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
 * - The surface never outgrows the viewport, less the collision padding
 *   on each side. Upstream only caps it at `maxWidth`.
 * - One keyframe pair, aimed per side by a var, rather than a slide
 *   per side and direction. The slide is `space[1]` rather than 4px.
 *
 * @see https://www.radix-ui.com/themes/docs/components/popover
 */

import { createVar, style } from '@vanilla-extract/css';
import { background, shadow } from '@lib/design';

/**
 * How close the window may come to the viewport's edges, in px. Themes'
 * `collisionPadding`, shared by the tether and the width cap below.
 */
export const COLLISION_PADDING = 10;

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
  // Collisions can move the window but not shrink it, so the viewport
  // caps the width too.
  maxWidth: `min(${maxWidth}, calc(100vw - ${2 * COLLISION_PADDING}px))`,
  outline: 'none',
  overflow: 'auto',
});
