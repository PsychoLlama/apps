import { Show, splitProps, type JSX } from 'solid-js';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { type RadiusScale } from '@lib/design';
import type {
  FloatingAlignment,
  FloatingPoint,
  FloatingSide,
} from './placement';
import {
  flexPropKeys,
  resolveFlexClasses,
  type FlexProps,
} from '../../../props/flex';
import {
  paddingPropKeys,
  resolvePaddingClasses,
  type PaddingProps,
} from '../../../props/padding';
import { type TestIdProps } from '../../../props/test-id';
import { Arrow, type ArrowDirection, type ArrowProps } from './arrow';
import { useAnchorElement } from './root';
import * as css from './floating-ui.css';

export {
  FloatingRoot,
  type FloatingRootDisplay,
  type FloatingRootProps,
} from './root';
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

/** Props for the floating content surface. */
export interface FloatingBodyProps
  extends FlexProps, PaddingProps, TestIdProps {
  /** Border radius of the surface, from the design token scale. */
  radius?: RadiusScale;
  /** Extra class names merged onto the surface element. */
  class?: string;
  /** Floating content to render. */
  children: JSX.Element;
}

/**
 * The visual surface of a floating primitive. Lays out and pads its
 * children; consumers style and test against this node.
 */
export const FloatingBody = (props: FloatingBodyProps) => {
  const [flex, afterFlex] = splitProps(props, flexPropKeys);
  const [padding, local] = splitProps(afterFlex, paddingPropKeys);

  const className = () =>
    [
      css.body,
      local.radius && css.bodyRadius[local.radius],
      ...resolveFlexClasses(flex),
      ...resolvePaddingClasses(padding),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div class={className()} data-testid={local.testId}>
      {local.children}
    </div>
  );
};

/**
 * Arrow configuration for a floating primitive. `direction` is omitted —
 * the window derives it from the resolved side.
 */
export type FloatingArrowProps = Omit<ArrowProps, 'direction'>;

/**
 * Direction the arrow points so it faces the anchor, keyed by the
 * resolved side. The window's `flex-direction` (driven from CSS by
 * `data-side`) seats the DOM-first arrow on the anchor-facing edge.
 */
const ARROW_DIRECTION_BY_SIDE: Record<FloatingSide, ArrowDirection> = {
  top: 'down',
  bottom: 'up',
  left: 'right',
  right: 'left',
};

/**
 * Props for the floating primitive entry point.
 *
 * The flex, padding, and test-id groups aren't the window's own — they
 * pass straight through to the {@link FloatingBody} surface, the node
 * that lays out and pads the content. So does {@link class} and
 * {@link radius}. The window keeps only what positions itself:
 * {@link side}, {@link align}, and the {@link arrow}.
 */
export interface FloatingWindowProps
  extends FlexProps, PaddingProps, TestIdProps {
  /** Edge of the anchor the surface binds to. Defaults to `'bottom'`. */
  side?: FloatingSide;
  /** Placement along that edge. Defaults to `'center'`. */
  align?: FloatingAlignment;
  /**
   * Gap between the anchor edge and the window, in px. In point mode,
   * the gap opens between the point and the window instead. Defaults
   * to `0`.
   */
  sideOffset?: number;
  /**
   * Nudge along the bound edge, in px. Positive values push a
   * `start`-aligned window toward `end`, an `end`-aligned window
   * toward `start`, and a centered window toward `end` — flipping
   * alignment never flips the sign. Defaults to `0`.
   */
  alignOffset?: number;
  /**
   * Bind the window to a point inside the anchor box instead of an
   * edge. {@link side} and {@link align} then describe which way the
   * window grows from that point.
   */
  point?: FloatingPoint;
  /**
   * Border radius of the surface, from the design token scale. Also
   * keeps a start/end-aligned arrow clear of the rounded corner.
   */
  radius?: RadiusScale;
  /**
   * Class merged onto the {@link FloatingBody} surface — the node that
   * carries the background, padding, and other chrome. Applies to the
   * body, not the positioned box.
   */
  class?: string;
  /**
   * Pointer arrow tying the surface to its anchor. Omit the config to
   * render without an arrow.
   */
  arrow?: FloatingArrowProps;
  /** Floating content to render. */
  children: JSX.Element;
}

/**
 * Entry point for a floating primitive. Owns the positioned box —
 * placing itself outside a side of the anchor and aligning along that
 * edge — and wraps the {@link FloatingBody} surface. Further plumbing
 * (collision handling, layering) will land here as the primitive grows.
 *
 * Must render inside a {@link FloatingRoot}, which supplies the box it
 * positions against.
 *
 * The arrow renders before the body because the window's
 * `flex-direction` seats it from that end — DOM order here is layout, not
 * paint order. The arrow always paints above the surface; it carries a
 * stacking context so the surface's shadow can't bleed onto it (see
 * `arrow.css`).
 */
export const FloatingWindow = (props: FloatingWindowProps) => {
  // Keep the window's own positioning props; forward everything else (flex,
  // padding, test-id, radius, class, children) onto the body surface.
  const [own, body] = splitProps(props, [
    'side',
    'align',
    'arrow',
    'sideOffset',
    'alignOffset',
    'point',
  ]);

  // Read for the structural assertion it carries: a window outside a root
  // has nothing to position against, and that should fail loudly rather
  // than render into whatever box happens to be nearest.
  useAnchorElement();

  const side = () => own.side ?? 'bottom';
  const align = () => own.align ?? 'center';

  const className = () =>
    [css.window, body.radius && css.arrowRadiusOffset[body.radius]]
      .filter(Boolean)
      .join(' ');

  // Continuous pixel inputs ride in as inline vars; the static rules fold
  // them into the placement math.
  const inlineVars = () =>
    assignInlineVars({
      ...(own.sideOffset !== undefined && {
        [css.sideOffset]: `${own.sideOffset}px`,
      }),
      ...(own.alignOffset !== undefined && {
        [css.alignOffset]: `${own.alignOffset}px`,
      }),
      ...(own.point && {
        [css.pointX]: `${own.point.x}px`,
        [css.pointY]: `${own.point.y}px`,
      }),
    });

  return (
    <div
      class={className()}
      style={inlineVars()}
      data-side={side()}
      data-align={align()}
      data-point={own.point ? '' : undefined}
    >
      <Show when={own.arrow}>
        {(arrow) => (
          <Arrow
            base={arrow().base}
            depth={arrow().depth}
            direction={ARROW_DIRECTION_BY_SIDE[side()]}
            align={arrow().align}
            hidden={arrow().hidden}
            class={arrow().class}
          />
        )}
      </Show>
      <FloatingBody {...body} />
    </div>
  );
};
