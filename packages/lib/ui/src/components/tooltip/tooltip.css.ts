/**
 * Tooltip styles.
 *
 * Ported from Radix UI Themes Tooltip. The surface is the floating
 * primitive's body, so padding and radius arrive as props there; what's
 * left here is the paint.
 *
 * Deviations from Radix:
 * - `gray-12` / `gray-1` map onto `neutral.solid[12]` / `neutral.solid[1]`.
 * - Skips `highContrast` (deferred deviation).
 * - No entrance animation yet. Upstream slides and fades a delayed open
 *   in; that lands with the hover delay.
 *
 * @see https://www.radix-ui.com/themes/docs/components/tooltip
 */

import { createVar, fallbackVar, style } from '@vanilla-extract/css';
import { neutral } from '@lib/design';

/**
 * Any CSS width the surface wraps at. Assigned inline from the
 * `maxWidth` prop; unset falls back to Themes' 360px.
 */
export const maxWidth = createVar();

/** The surface. Padding and radius are props. */
export const content = style({
  backgroundColor: neutral.solid[12],
  maxWidth: fallbackVar(maxWidth, '360px'),
});

/**
 * The visible copy. A tooltip is chrome, not content, so it reads as a
 * label: default cursor and, via `selectable={false}`, no selection.
 */
export const text = style({
  color: neutral.solid[1],
  cursor: 'default',
});

/**
 * The positioned box. Always in the DOM; shown by the surface's
 * `data-state`, which the window reads through `:has()` since the
 * attribute rides on the body inside it.
 *
 * Carries the surface color as `color` so the arrow, which fills with
 * `currentColor`, matches the surface without a class of its own. The
 * text sets its own color back.
 */
export const window = style({
  color: neutral.solid[12],
  selectors: {
    '&:where(:has(> [data-state="closed"]))': {
      display: 'none',
    },
  },
});
