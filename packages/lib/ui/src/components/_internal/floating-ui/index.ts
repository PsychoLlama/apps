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
 *   never handed an element by hand. Its native attributes land on the
 *   wrapper, the one element holding both the anchored element and its
 *   windows, so a component listens there for focus and pointer moving
 *   between the two.
 * - `FloatingWindow` — the positioned box. It will grow to own the
 *   plumbing floating components share (anchoring, layering). Its
 *   native attributes land on the box, which is where a component's
 *   open state (`data-state`) and enter animation belong.
 * - `FloatingBody` — the visual surface, rendered as the window's
 *   child. It lays out and pads its children and is the node consumers
 *   style and target in tests. It is also the node a component gives
 *   semantics to: the base carries no role or ARIA of its own, but
 *   forwards every native attribute and handler so a port can label,
 *   focus, and listen on it exactly as Radix does on its content node.
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
 * The hooks behind it live under `tether/`. One of them is exported:
 * `useTetherState` reads where the window under a root landed, for a
 * component that has to do something about it rather than only style
 * it. The window publishes there and reads it back the same way, so
 * there's one answer and everyone under the root gets it. `AXIS_BY_SIDE`
 * comes with it, for turning that side into the axis most rules and
 * coordinates actually turn on. The measurement carries the boxes it was
 * taken from, under `middlewareData.boxes`, so a component that needs the
 * anchor's extent reads what the tether already measured instead of
 * measuring again. Each box comes in viewport coordinates as well as the
 * measurement's own, which is what a component comparing one against a
 * pointer event needs and the only part it couldn't work out for itself.
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
  useAnchorElement,
  useFloatingTag,
  type FloatingRootDisplay,
  type FloatingElement,
  type FloatingRootProps,
  type FloatingTag,
} from './root';
export {
  type FloatingAlignment,
  type FloatingPoint,
  type FloatingSide,
  type FloatingTether,
} from './types';
export {
  AXIS_BY_SIDE,
  FloatingWindow,
  type FloatingArrowProps,
  type FloatingWindowProps,
} from './window';
export { FloatingBody, type FloatingBodyProps } from './body';
export { useTetherState, type TetherState } from './tether/use-tether';
export {
  type FloatingBox,
  type FloatingBoxes,
  type FloatingMeasurement,
  type FloatingMiddlewareData,
} from './tether/middleware/boxes';
export {
  Arrow,
  type ArrowAlign,
  type ArrowDirection,
  type ArrowProps,
} from './arrow';
