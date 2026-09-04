/**
 * Internal primitive for positioned floating UI — tooltips, dropdowns,
 * popovers, menus, and anything else that floats relative to an anchor.
 *
 * Unlike most of `@lib/ui`, this is not ported from Radix. It's our own
 * feature, built to own the anchoring, layering, and surface chrome that
 * every floating component reaches for.
 *
 * The primitive splits into three layers:
 * - `FloatingRoot` — the box everything positions against. It wraps the
 *   anchored element and publishes it through context, so a window is
 *   never handed an element by hand.
 * - `FloatingWindow` — the positioned box. It will grow to own the
 *   plumbing floating surfaces share (anchoring, layering) and wraps the
 *   body.
 * - `FloatingBody` — the visual surface. It lays out and pads its
 *   children and is the node consumers style and target in tests.
 *
 * Placement is pure CSS, and today that is the whole of it: the window is
 * a sibling of the anchored element inside the root, so it lands on the
 * right side with no JavaScript and no measurement.
 *
 * Collision handling — measuring the page and re-resolving the placement
 * to dodge whatever clips the surface — is the progressive enhancement
 * this is built to carry, and it is deliberately absent. A first attempt
 * was torn out wholesale rather than rescued, to be rebuilt a piece at a
 * time. Nothing of it is left in place: no vars, no escape-hatch
 * attribute, no measurement. The one thing the rebuild will need that
 * already exists is the anchor element `FloatingRoot` publishes, which
 * is here for the pure-CSS placement's own sake anyway.
 */

// The CSS placement is deliberately hand-rolled and short-lived. It
// exists because the CSS `anchor-positioning` primitives and the
// `popover` attribute aren't baseline-available yet. Once they are, the
// anchoring/layering plumbing collapses into a few CSS properties.
//
// The pieces are named and shaped after their anchor-positioning
// successors so the migration stays mechanical:
// - `<FloatingRoot>`            → `anchor-name`
// - `data-side` + `data-align`  → `position-area` (side/align pairs map
//   onto its two-keyword grid values: bottom/center → `bottom`,
//   bottom/start → `bottom span-right`, …)

export {
  FloatingRoot,
  type FloatingRootDisplay,
  type FloatingRootProps,
} from './root';
export {
  FloatingWindow,
  type FloatingArrowProps,
  type FloatingWindowProps,
} from './window';
export { FloatingBody, type FloatingBodyProps } from './body';
export {
  Arrow,
  type ArrowAlign,
  type ArrowDirection,
  type ArrowProps,
} from './arrow';
export {
  type FloatingAlignment,
  type FloatingPlacement,
  type FloatingPoint,
  type FloatingSide,
} from './placement';
