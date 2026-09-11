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
 *   plumbing floating components share (anchoring, layering) and wraps the
 *   body.
 * - `FloatingBody` — the visual surface. It lays out and pads its
 *   children and is the node consumers style and target in tests. It is
 *   also the node a component gives semantics to: the base carries no
 *   role or ARIA of its own, but forwards every native attribute and
 *   handler so a port can label, focus, and listen on it exactly as
 *   Radix does on its content node.
 *
 * Placement is pure CSS by default: the window is a sibling of the
 * anchored element inside the root, so it lands on the right side with
 * no JavaScript and no measurement.
 *
 * A `tether` on the window is the progressive enhancement on top. It
 * measures the page with `@floating-ui/dom` and re-resolves the
 * placement as things move, running whatever middleware the component
 * supplies between the window's own `offset` and `arrow`. Given room,
 * the measured placement is the CSS one to the pixel, so the handoff is
 * invisible; the tether only shows its hand when something has to give.
 * The hooks behind it live under `tether/` and aren't exported.
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
  type FloatingAlignment,
  type FloatingPoint,
  type FloatingSide,
  type FloatingTether,
} from './types';
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
