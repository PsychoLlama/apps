import { Show, createSignal, splitProps, type JSX } from 'solid-js';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { radius as radiusTokens, type RadiusScale } from '@lib/design';
import { createTether, type TetherOptions } from './tether/create-tether';
import type {
  FloatingAlignment,
  FloatingPoint,
  FloatingSide,
} from './tether/placement';
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
import * as arrowCss from './arrow.css';
import * as css from './floating-ui.css';

export { anchor } from './floating-ui.css';
export {
  Arrow,
  type ArrowAlign,
  type ArrowDirection,
  type ArrowProps,
} from './arrow';
export {
  type FloatingAlignment,
  type FloatingPoint,
  type FloatingSide,
} from './tether/placement';
export {
  type TetherDecisions,
  type TetherFallback,
  type TetherOptions,
} from './tether/create-tether';

/**
 * Internal primitive for positioned floating UI — tooltips, dropdowns,
 * popovers, menus, and anything else that floats relative to an anchor.
 *
 * Unlike most of `@lib/ui`, this is not ported from Radix. It's our own
 * feature, built to own the anchoring, layering, and surface chrome that
 * every floating component reaches for.
 *
 * The primitive splits into two layers:
 * - `FloatingContainer` — the outer entry point. It will grow to own the
 *   plumbing floating surfaces share (anchoring, layering) and wraps the
 *   body.
 * - `FloatingBody` — the visual surface. It lays out and pads its
 *   children and is the node consumers style and target in tests.
 *
 * Placement is pure CSS: the surface is a sibling of the anchor, so it
 * lands on the right side with no JavaScript and no measurement. The
 * tether (see `./tether/create-tether`) is the progressive enhancement
 * on top — once it can measure the page, `@floating-ui/dom` resolves a
 * placement that dodges whatever is clipping the surface, and its answer
 * merges over the requested one here, in props space. The tether never
 * touches the DOM, so this component stays the shell's only writer.
 */

// The CSS placement is deliberately hand-rolled and short-lived. It
// exists because the CSS `anchor-positioning` primitives and the
// `popover` attribute aren't baseline-available yet. Once they are, the
// anchoring/layering plumbing collapses into a few CSS properties.
//
// The pieces are named and shaped after their anchor-positioning
// successors so the migration stays mechanical:
// - `anchor` class              → `anchor-name`
// - `data-side` + `data-align`  → `position-area` (side/align pairs map
//   onto its two-keyword grid values: bottom/center → `bottom`,
//   bottom/start → `bottom span-right`, …)
// - tether `fallbacks`          → `position-try-fallbacks`
// - `--anchor-width/height`     → `anchor-size(width)` / `(height)`
// - `--available-width/height`  → the sizing the `position-area`
//   region's containing block provides natively

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
 * the container derives it from the resolved side.
 */
export interface FloatingArrowProps extends Omit<ArrowProps, 'direction'> {
  /** Whether to render the arrow. Defaults to `false`. */
  visible?: boolean;
}

/**
 * Direction the arrow points so it faces the anchor, keyed by the
 * resolved side. The container's `flex-direction` (driven from CSS by
 * `data-side`) seats the DOM-first arrow on the anchor-facing edge.
 */
const ARROW_DIRECTION_BY_SIDE: Record<FloatingSide, ArrowDirection> = {
  top: 'down',
  bottom: 'up',
  left: 'right',
  right: 'left',
};

/**
 * The arrow's clearance from the surface's corners: one border radius,
 * where the straight run of the rounded edge begins. `full` resolves to
 * a pill radius the tether clamps down to whatever the surface can
 * actually give.
 */
const arrowPaddingFor = (scale: RadiusScale | undefined) =>
  scale === undefined ? 0 : parseFloat(radiusTokens[scale]);

/**
 * Props for the floating primitive entry point.
 *
 * The flex, padding, and test-id groups aren't the shell's own — they
 * pass straight through to the {@link FloatingBody} surface, the node
 * that lays out and pads the content. So does {@link class} and
 * {@link radius}. The shell keeps only what positions the surface:
 * {@link side}, {@link align}, and the {@link arrow}.
 */
export interface FloatingContainerProps
  extends FlexProps, PaddingProps, TestIdProps {
  /**
   * The anchor element the surface positions against — the same node
   * carrying the `anchor` class. The pure-CSS placement resolves it
   * structurally and doesn't need this; the tether can't, so it stays
   * dormant until the element is provided.
   */
  anchor?: HTMLElement;
  /** Edge of the anchor the surface binds to. Defaults to `'bottom'`. */
  side?: FloatingSide;
  /** Placement along that edge. Defaults to `'center'`. */
  align?: FloatingAlignment;
  /**
   * Gap between the anchor edge and the surface, in px. In point mode,
   * the gap opens between the point and the surface instead. Defaults
   * to `0`.
   */
  sideOffset?: number;
  /**
   * Nudge along the bound edge, in px. Positive values push a
   * `start`-aligned surface toward `end`, an `end`-aligned surface
   * toward `start`, and a centered surface toward `end` — flipping
   * alignment never flips the sign. Defaults to `0`.
   */
  alignOffset?: number;
  /**
   * Bind the surface to a point inside the anchor box instead of an
   * edge. {@link side} and {@link align} then describe which way the
   * surface grows from that point.
   */
  point?: FloatingPoint;
  /**
   * Progressive enhancement: watch the anchor, surface, and everything
   * clipping them, and re-resolve the placement to dodge collisions.
   * Requires {@link anchor}. Without JavaScript — or before hydration —
   * the pure-CSS placement stands.
   */
  tether?: TetherOptions;
  /**
   * Border radius of the surface, from the design token scale. Also
   * keeps a start/end-aligned arrow clear of the rounded corner.
   */
  radius?: RadiusScale;
  /**
   * Class merged onto the {@link FloatingBody} surface — the node that
   * carries the background, padding, and other chrome. Applies to the
   * body, not the positioning shell.
   */
  class?: string;
  /** Pointer arrow tying the surface to its anchor. Hidden by default. */
  arrow?: FloatingArrowProps;
  /** Floating content to render. */
  children: JSX.Element;
}

/**
 * Entry point for a floating primitive. Owns the positioning shell —
 * placing the surface outside a side of the anchor and aligning it along
 * that edge — and wraps the {@link FloatingBody} surface. Further
 * plumbing (layering) will land here as the primitive grows.
 *
 * The arrow renders before the body so, once both are stacked, the body
 * paints over the arrow's shadow seam without needing a `z-index`.
 */
export const FloatingContainer = (props: FloatingContainerProps) => {
  // Keep the shell's positioning props; forward everything else (flex,
  // padding, test-id, radius, class, children) onto the body surface.
  const [shell, body] = splitProps(props, [
    'anchor',
    'side',
    'align',
    'arrow',
    'sideOffset',
    'alignOffset',
    'point',
    'tether',
  ]);

  const [shellElement, setShellElement] = createSignal<HTMLDivElement>();
  const [arrowElement, setArrowElement] = createSignal<SVGSVGElement>();

  const decisions = createTether(() => {
    const popup = shellElement();
    const anchorElement = shell.anchor;
    if (!popup || !anchorElement || !shell.tether) return null;

    return {
      popup,
      anchor: anchorElement,
      placement: {
        side: shell.side ?? 'bottom',
        align: shell.align ?? 'center',
        sideOffset: shell.sideOffset ?? 0,
        alignOffset: shell.alignOffset ?? 0,
      },
      ...(shell.point && { point: shell.point }),
      ...(shell.arrow?.visible && { arrow: arrowElement() }),
      arrowPadding: arrowPaddingFor(body.radius),
      ...shell.tether,
    };
  });

  const side = () => decisions()?.side ?? shell.side ?? 'bottom';
  const align = () => decisions()?.align ?? shell.align ?? 'center';

  const className = () =>
    [css.container, body.radius && css.arrowRadiusOffset[body.radius]]
      .filter(Boolean)
      .join(' ');

  // Continuous pixel inputs ride in as inline vars; the static rules
  // fold them into the placement math. The tether's own answer rides in
  // the same way, plus the `data-side`/`data-align` attributes.
  const inlineVars = () => {
    const resolved = decisions();
    const arrowOffset = resolved?.arrowOffset ?? null;
    const available =
      resolved &&
      resolved.availableWidth !== null &&
      resolved.availableHeight !== null
        ? { width: resolved.availableWidth, height: resolved.availableHeight }
        : null;

    return assignInlineVars({
      ...(shell.sideOffset !== undefined && {
        [css.sideOffset]: `${shell.sideOffset}px`,
      }),
      ...(shell.alignOffset !== undefined && {
        [css.alignOffset]: `${shell.alignOffset}px`,
      }),
      ...(shell.point && {
        [css.pointX]: `${shell.point.x}px`,
        [css.pointY]: `${shell.point.y}px`,
      }),
      ...(resolved && {
        [css.tetherX]: `${resolved.x}px`,
        [css.tetherY]: `${resolved.y}px`,
        [css.transformOrigin]: resolved.transformOrigin,
        [css.anchorWidth]: `${resolved.anchorWidth}px`,
        [css.anchorHeight]: `${resolved.anchorHeight}px`,
      }),
      ...(available && {
        [css.availableWidth]: `${available.width}px`,
        [css.availableHeight]: `${available.height}px`,
      }),
      ...(arrowOffset !== null && {
        [arrowCss.tetherOffset]: `${arrowOffset}px`,
      }),
    });
  };

  return (
    <div
      ref={setShellElement}
      class={className()}
      style={inlineVars()}
      data-side={side()}
      data-align={align()}
      data-point={shell.point ? '' : undefined}
      data-tethered={decisions() ? '' : undefined}
      data-anchor-hidden={decisions()?.anchorHidden ? '' : undefined}
    >
      <Show when={shell.arrow?.visible}>
        <Arrow
          ref={setArrowElement}
          base={shell.arrow?.base}
          depth={shell.arrow?.depth}
          direction={ARROW_DIRECTION_BY_SIDE[side()]}
          align={shell.arrow?.align}
          hidden={shell.arrow?.hidden ?? decisions()?.arrowHidden}
          class={shell.arrow?.class}
        />
      </Show>
      <FloatingBody {...body} />
    </div>
  );
};
