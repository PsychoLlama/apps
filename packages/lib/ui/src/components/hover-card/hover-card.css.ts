/**
 * HoverCard styles.
 *
 * Ported from Radix UI Themes HoverCard. The surface is the floating
 * primitive's body, so padding and radius arrive as props there; what's
 * left here is the paint, and hiding the window at rest.
 *
 * Deviations from Radix:
 * - `--color-panel-solid` / `--shadow-4` map onto `background.panelSolid`
 *   / `shadow[4]`.
 * - Motion is the shared floating-window motion, with `Popover`'s
 *   deviations: durations and easing ride the scale, and reduced motion
 *   collapses them with no media query.
 * - At rest the window is hidden with `visibility` rather than
 *   unmounted, which also takes it out of the tab order and the
 *   accessibility tree.
 * - The surface never outgrows the viewport, less the collision padding
 *   on each side. Upstream only caps it at `maxWidth`.
 * - No `--inset-padding-*` vars. Deferred: `Inset` only reads `Card`'s.
 *
 * @see https://www.radix-ui.com/themes/docs/components/hover-card
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

/**
 * The positioned box. Always in the DOM; at rest — never opened, or
 * closed with its exit settled — it carries no `data-state` and is
 * hidden, which also takes it out of the tab order and the
 * accessibility tree.
 */
export const window = style({
  selectors: {
    '&:where(:not([data-state]))': { visibility: 'hidden' },
  },
});

/** The surface. Padding and radius are props. */
export const content = style({
  backgroundColor: background.panelSolid,
  boxShadow: shadow[4],
  // Collisions can move the window but not shrink it, so the viewport
  // caps the width too.
  maxWidth: `min(${maxWidth}, calc(100vw - ${2 * COLLISION_PADDING}px))`,
  overflow: 'auto',
});
