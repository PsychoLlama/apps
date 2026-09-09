import { createMemo, type Accessor } from 'solid-js';
import {
  arrow,
  offset,
  type ArrowOptions,
  type Middleware,
} from '@floating-ui/dom';

/**
 * Inputs to {@link useMiddleware}.
 *
 * Accessors throughout: every value is a prop or a ref, and the list has
 * to be rebuilt when any of them changes so the next measurement uses
 * the current geometry.
 */
export interface MiddlewareInputs {
  /** Gap between the anchor edge and the window, in px. */
  sideOffset: Accessor<number>;

  /** Nudge along the bound edge, in px. Ignored for centered windows. */
  alignOffset: Accessor<number>;

  /**
   * The arrow, if one is rendered. Omitting it omits `arrow`. The
   * window passes its corner radius as `padding` so the arrow never
   * rides onto the curve.
   */
  arrow: Accessor<ArrowOptions | undefined>;

  /**
   * The consumer's middleware — constraints such as `shift`, `flip`,
   * `size`, and `hide`. Never `offset` or `arrow`; see
   * {@link useMiddleware}.
   */
  middleware: Accessor<readonly Middleware[]>;
}

/**
 * Assemble the middleware list for a measurement: the window's own
 * geometry wrapped around whatever constraints the consumer supplies.
 *
 * The list is a fixed sandwich. `offset` goes first, fed from the same
 * `sideOffset`/`alignOffset` the stylesheet reads, so the measured
 * placement starts from exactly the pixels the CSS placement paints.
 * The consumer's constraints go in the middle, in the order given.
 * `arrow` goes last, because it has to see the position the constraints
 * settled on before it can seat the arrow against the anchor.
 *
 * `offset` and `arrow` are reserved. Nothing enforces it at runtime —
 * the check isn't worth paying for on every rebuild — but a consumer
 * list carrying either is a review-time bug: the window is the only
 * thing that knows the geometry those two encode, and letting a consumer
 * restate it is how the two modes would stop agreeing.
 *
 * ```ts
 * const middleware = useMiddleware({
 *   sideOffset: () => props.sideOffset ?? 0,
 *   alignOffset: () => props.alignOffset ?? 0,
 *   arrow: () => arrowElement() && { element: arrowElement(), padding },
 *   middleware: () => props.tether.middleware,
 * });
 * ```
 */
export const useMiddleware = (
  inputs: MiddlewareInputs,
): Accessor<Middleware[]> => {
  const middleware = createMemo(() => {
    const arrowInput = inputs.arrow();

    return [
      offset({
        mainAxis: inputs.sideOffset(),
        alignmentAxis: inputs.alignOffset(),
      }),
      ...inputs.middleware(),
      ...(arrowInput ? [arrow(arrowInput)] : []),
    ];
  });

  return middleware;
};
