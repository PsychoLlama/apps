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
