import { Show, createSignal, splitProps, type JSX } from 'solid-js';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { radius as radiusTokens, type RadiusScale } from '@lib/design';
import { createTether } from './tether/create-tether';
import type { TetherOptions } from './tether/middleware';
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
import { useAnchorElement } from './root';
import * as arrowCss from './arrow.css';
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
} from './tether/placement';
export { type TetherState } from './tether/create-tether';
export {
  type TetherFallback,
  type TetherFlipOptions,
  type TetherOptions,
  type TetherPass,
} from './tether/middleware';

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
 * Placement is pure CSS: the window is a sibling of the anchored element
 * inside the root, so it lands on the right side with no JavaScript and
 * no measurement. The
 * tether (see `./tether/create-tether`) is the progressive enhancement
 * on top — once it can measure the page, `@floating-ui/dom` resolves a
 * placement that dodges whatever is clipping the surface, and its answer
 * merges over the requested one here, in props space. The tether never
 * touches the DOM, so this component stays the window's only writer.
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
 * the window derives it from the resolved side.
 */
export interface FloatingArrowProps extends Omit<ArrowProps, 'direction'> {
  /** Whether to render the arrow. Defaults to `false`. */
  visible?: boolean;
}

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
   * Progressive enhancement: watch the anchor, surface, and everything
   * clipping them, and re-resolve the placement to dodge collisions.
   * Without JavaScript — or before hydration — the pure-CSS placement
   * stands on its own.
   *
   * Required, because a floating window that can't dodge what clips it
   * is broken rather than configured — the call has to be made, not
   * defaulted into. `{}` takes every pass at its default and the passes
   * tune themselves from there; `false` stands the tether down for good,
   * pinning the window to the pure-CSS placement.
   */
  tether: TetherOptions | false;
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
  /** Pointer arrow tying the surface to its anchor. Hidden by default. */
  arrow?: FloatingArrowProps;
  /** Floating content to render. */
  children: JSX.Element;
}

/**
 * Entry point for a floating primitive. Owns the positioned box —
 * placing itself outside a side of the anchor and aligning along that
 * edge — and wraps the {@link FloatingBody} surface. Further plumbing
 * (layering) will land here as the primitive grows.
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
    'tether',
  ]);

  const anchorElement = useAnchorElement();
  const [floatingElement, setFloatingElement] = createSignal<HTMLDivElement>();
  const [arrowElement, setArrowElement] = createSignal<SVGSVGElement>();

  const tether = createTether(() => {
    const floating = floatingElement();
    const anchor = anchorElement();
    const options = own.tether;

    // Dormant until both boxes exist to measure — that gap is the
    // progressive-enhancement window the pure-CSS placement covers, and
    // `tether={false}` holds it open for good.
    if (!floating || !anchor || options === false) return null;

    return {
      floating,
      anchor,
      placement: {
        side: own.side ?? 'bottom',
        align: own.align ?? 'center',
      },
      sideOffset: own.sideOffset ?? 0,
      alignOffset: own.alignOffset ?? 0,
      arrowPadding: arrowPaddingFor(body.radius),
      ...(own.point && { point: own.point }),
      ...(own.arrow?.visible && { arrow: arrowElement() }),
      ...options,
    };
  });

  const side = () => tether.placement?.side ?? own.side ?? 'bottom';
  const align = () => tether.placement?.align ?? own.align ?? 'center';

  const className = () =>
    [css.window, body.radius && css.arrowRadiusOffset[body.radius]]
      .filter(Boolean)
      .join(' ');

  // Continuous pixel inputs ride in as inline vars; the static rules
  // fold them into the placement math. The tether's own answer rides in
  // the same way, plus the `data-side`/`data-align` attributes.
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
      ...(tether.translate && {
        [css.tetherX]: `${tether.translate.x}px`,
        [css.tetherY]: `${tether.translate.y}px`,
      }),
      ...(tether.transformOrigin && {
        [css.transformOrigin]: tether.transformOrigin,
      }),
      ...(tether.anchor && {
        [css.anchorWidth]: `${tether.anchor.width}px`,
        [css.anchorHeight]: `${tether.anchor.height}px`,
      }),
      ...(tether.available && {
        [css.availableWidth]: `${tether.available.width}px`,
        [css.availableHeight]: `${tether.available.height}px`,
      }),
      ...(tether.arrow && {
        [arrowCss.tetherOffset]: `${tether.arrow.offset}px`,
      }),
    });

  return (
    <div
      ref={setFloatingElement}
      class={className()}
      style={inlineVars()}
      data-side={side()}
      data-align={align()}
      data-point={own.point ? '' : undefined}
      data-tethered={tether.placement ? '' : undefined}
    >
      <Show when={own.arrow?.visible}>
        <Arrow
          ref={setArrowElement}
          base={own.arrow?.base}
          depth={own.arrow?.depth}
          direction={ARROW_DIRECTION_BY_SIDE[side()]}
          align={own.arrow?.align}
          hidden={own.arrow?.hidden ?? tether.arrow?.hidden}
          class={own.arrow?.class}
        />
      </Show>
      <FloatingBody {...body} />
    </div>
  );
};
