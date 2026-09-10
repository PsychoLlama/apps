import { type Middleware } from '@floating-ui/dom';

/**
 * Vocabulary shared across the floating primitive.
 *
 * These describe a placement, which both the components and the tether
 * hooks have to speak: the components render it as data attributes, the
 * tether resolves it against the page. Neither owns it, so it lives
 * here rather than in whichever one happened to need it first.
 */

/**
 * Which edge of the anchor a window binds to. Maps to `data-side`, and
 * to `position-area` once anchor positioning is baseline.
 */
export type FloatingSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * Placement of the window along the anchor edge it binds to. `start`
 * hugs the top (left/right sides) or left (top/bottom sides); `end` the
 * opposite; `center` splits the difference.
 */
export type FloatingAlignment = 'start' | 'center' | 'end';

/**
 * A coordinate inside the anchor box, in px from its top-left corner.
 * Binds a window to a point instead of an edge — context menus anchor
 * to the pointer, item-aligned selects to a measured item. The window
 * renders it as `data-point` and inline vars; the tether measures
 * against it as a virtual reference.
 */
export type FloatingPoint = Pick<DOMPoint, 'x' | 'y'>;

/**
 * Opt a window into measured placement. Present, the window measures
 * the page and re-resolves its placement whenever the anchor moves;
 * absent, placement is pure CSS. Given enough room the two agree to the
 * pixel, so the switch is invisible until something forces a decision.
 *
 * Heavily subject to change while the tether is workshopped.
 */
export interface FloatingTether {
  /**
   * Middleware run between the window's own `offset` and `arrow`, in
   * order: constraints such as `shift`, `flip`, `size`, and `hide`.
   * Never `offset` or `arrow` — the window owns those so the measured
   * placement can't drift from the CSS one.
   */
  middleware: Middleware[];
}
