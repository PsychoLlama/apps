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
 *
 * @see https://www.radix-ui.com/themes/docs/components/popover
 */

import { createVar, style } from '@vanilla-extract/css';
import { background, shadow } from '@lib/design';

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
  overflow: 'auto',
});
