import { createMemo, type Accessor } from 'solid-js';
import { type ReferenceElement, type VirtualElement } from '@floating-ui/dom';
import { type FloatingPoint } from '../types';

/** Inputs to {@link useReference}. */
export interface ReferenceInputs {
  /** The anchor element, from `useAnchorElement()`. */
  anchor: Accessor<HTMLElement | undefined>;

  /** The point inside it to bind to instead, if the window is pointed. */
  point: Accessor<FloatingPoint | undefined>;
}

/**
 * A point inside the anchor, as something the tether can bind to the
 * way it binds to an element.
 *
 * A `VirtualElement` in floating-ui's terms: a 0×0 rect at the point,
 * measured fresh on every read so it tracks the anchor as the page
 * scrolls and reflows. `contextElement` names the real anchor, which is
 * how `autoUpdate` finds the scroll ancestors and resize targets to
 * watch.
 *
 * The point is clamped to the anchor's box. A point is meant to sit
 * inside it, and an anchor that shrinks after the point was taken would
 * otherwise leave the window hanging off a spot outside. The CSS pins
 * clamp the same way (see `window.css`), but that only covers CSS mode:
 * a tethered window sits on the measured coordinates verbatim, so the
 * clamp has to happen here for the two modes to keep agreeing.
 */
const toVirtualPoint = (
  anchor: Element,
  point: FloatingPoint,
): VirtualElement => ({
  contextElement: anchor,
  getBoundingClientRect: () => {
    const rect = anchor.getBoundingClientRect();
    const left = rect.left + Math.min(Math.max(point.x, 0), rect.width);
    const top = rect.top + Math.min(Math.max(point.y, 0), rect.height);

    return {
      x: left,
      y: top,
      top,
      left,
      right: left,
      bottom: top,
      width: 0,
      height: 0,
    };
  },
});

/**
 * Resolve what the tether measures against: the anchor element itself,
 * or a virtual point inside it when the window is pointed. Nothing
 * downstream knows which — `offset`, `flip`, and the rest see a
 * reference and place the subject around it, which for a point is the
 * same picture the CSS `data-point` pins paint.
 *
 * Radix's ContextMenu does the same with the pointer position.
 *
 * ```ts
 * const reference = useReference({ anchor, point: () => props.point });
 * ```
 */
export const useReference = (
  inputs: ReferenceInputs,
): Accessor<ReferenceElement | undefined> => {
  const reference = createMemo(() => {
    const anchor = inputs.anchor();
    const point = inputs.point();

    return anchor && point ? toVirtualPoint(anchor, point) : anchor;
  });

  return reference;
};
