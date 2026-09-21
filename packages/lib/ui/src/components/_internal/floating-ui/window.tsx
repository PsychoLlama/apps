import { createSignal, Show, splitProps, type JSX } from 'solid-js';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { radius, type RadiusScale } from '@lib/design';
import clx from '@lib/classnames';
import { type RequiredTestIdProps } from '../../../props/test-id';
import {
  type FloatingAlignment,
  type FloatingAxis,
  type FloatingPoint,
  type FloatingSide,
  type FloatingTether,
} from './types';
import { Arrow, type ArrowDirection, type ArrowProps } from './arrow';
import { useAnchorElement } from './root';
import { roundByDevicePixel } from './tether/pixel-ratio';
import { useReference } from './tether/use-reference';
import { DEFAULT_ALIGN, DEFAULT_SIDE } from './tether/placement';
import { useTether, useTetherState } from './tether/use-tether';
import {
  base as arrowBase,
  depth as arrowDepth,
  translateX as arrowX,
  translateY as arrowY,
} from './arrow.css';
import * as css from './window.css';

/**
 * Arrow configuration for a floating primitive. `direction`, `axis`, and
 * `align` are omitted — the window derives them from its own placement,
 * which is what aims the arrow back at whatever the window is bound to.
 * So are `hidden`, which the tether decides, and `testId`, which derives
 * from the window's own. The size is optional here, where its default
 * lives.
 */
export interface FloatingArrowProps extends Omit<
  ArrowProps,
  'direction' | 'axis' | 'align' | 'hidden' | 'testId' | 'base' | 'depth'
> {
  /**
   * Length of the triangle's base — the edge that runs along the anchor.
   * In px.
   * @default 12
   */
  base?: number;

  /**
   * Depth the point protrudes from the base toward the anchor, in px.
   * @default 6
   */
  depth?: number;
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
 * Axis the window travels on to clear the anchor, keyed by the resolved
 * side. Rides along as `data-axis` because most placement rules turn on
 * the axis alone, and naming it beats spelling out a side pair in every
 * selector.
 */
const AXIS_BY_SIDE: Record<FloatingSide, FloatingAxis> = {
  top: 'y',
  bottom: 'y',
  left: 'x',
  right: 'x',
};

/**
 * Props for the floating primitive entry point.
 *
 * Every native attribute and handler lands on the positioned box, the
 * node that carries the placement and its `data-side`/`data-align`.
 * The surface is a separate node the consumer renders as a child (a
 * `FloatingBody`, usually), so what belongs on the surface is spread
 * there.
 *
 * A test id is required: the box is where placement and open state
 * show up, so every floating component's tests need a handle on it.
 * The arrow's id derives from it.
 */
export interface FloatingWindowProps
  extends
    RequiredTestIdProps,
    Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'> {
  /** Edge of the anchor the window binds to. Defaults to `'bottom'`. */
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
   * `start`-aligned window toward `end` and an `end`-aligned window
   * toward `start` — flipping alignment never flips the sign. A
   * centered window ignores it. Defaults to `0`.
   */
  alignOffset?: number;

  /**
   * Bind the window to a point inside the anchor box instead of an
   * edge. {@link side} and {@link align} then describe which way the
   * window grows from that point.
   */
  point?: FloatingPoint;

  /**
   * Measure the page and re-resolve the placement as things move. Omit
   * for pure-CSS placement. Composes with {@link point}: a pointed
   * window measures against the point.
   */
  tether?: FloatingTether;

  /**
   * Corner radius, from the design token scale. Inherited by the
   * surface as its `border-radius`, and what keeps a start/end-aligned
   * arrow clear of the rounded corner.
   */
  radius?: RadiusScale;

  /**
   * Class merged onto the positioned box — the node that carries the
   * placement, the resolved `data-side`/`data-align`, and the
   * `transform-origin` facing the anchor. The box's `transform` is
   * free (placement rides on `translate`), so this is where an enter
   * animation goes: it scales the arrow and the surface together, out
   * of the corner that faces the anchor.
   */
  class?: string;

  /**
   * Inline styles merged onto the positioned box, under the window's
   * own placement vars. For values only the call site knows at
   * runtime, such as a var it assigns from a prop; static styling
   * belongs in {@link class}.
   */
  style?: JSX.CSSProperties;

  /**
   * Pointer arrow tying the window to its anchor. Omit the config to
   * render without an arrow.
   */
  arrow?: FloatingArrowProps;

  /**
   * The surface to float: a `FloatingBody`, which lays out and pads the
   * content and is the node to give semantics to.
   */
  children: JSX.Element;
}

/**
 * Entry point for a floating primitive. Owns the positioned box —
 * placing itself outside a side of the anchor and aligning along that
 * edge — around the surface it's given.
 *
 * Must render inside a `FloatingRoot`, which supplies the box it
 * positions against.
 *
 * Placement is CSS until a {@link FloatingWindowProps.tether} is given.
 * Then the window measures itself against the anchor and, once a
 * measurement lands, switches to the measured coordinates
 * (`data-tethered`). The requested placement paints first in both
 * cases, so there's nothing to hide while waiting: a client-side open
 * measures before the browser gets a chance to paint, and a
 * statically rendered one paints at its CSS placement and adjusts once
 * the tether wakes up.
 *
 * The arrow renders before the surface because the window's
 * `flex-direction` seats it from that end — DOM order here is layout, not
 * paint order. The arrow always paints above the surface; it carries a
 * stacking context so the surface's shadow can't bleed onto it (see
 * `arrow.css`).
 */
export const FloatingWindow = (props: FloatingWindowProps) => {
  // Keep what positions the box and what it renders; every other
  // attribute is the consumer's and spreads onto the box.
  const [own, box] = splitProps(props, [
    'side',
    'align',
    'arrow',
    'sideOffset',
    'alignOffset',
    'point',
    'tether',
    'radius',
    'class',
    'style',
    'testId',
    'children',
  ]);

  const [subject, setSubject] = createSignal<HTMLDivElement>();
  const [arrowElement, setArrowElement] = createSignal<SVGSVGElement>();

  const anchor = useAnchorElement();

  // The placement the window is asking for. Handed to the tether as its
  // starting point and used as the fallback below, so the answer before
  // a measurement lands is the same one the CSS is painting.
  const requestedSide = () => own.side ?? DEFAULT_SIDE;
  const requestedAlign = () => own.align ?? DEFAULT_ALIGN;

  useTether({
    anchor: useReference({ anchor, point: () => own.point }),
    side: requestedSide,
    align: requestedAlign,
    sideOffset: () => own.sideOffset ?? 0,
    alignOffset: () => own.alignOffset ?? 0,

    // Withholding the subject is the tether's off switch.
    subject: () => (own.tether ? subject() : undefined),

    // The corner radius is the arrow's padding, so a shifted arrow stops
    // where the straight edge does instead of riding onto the curve.
    arrow: () => {
      const element = own.arrow && arrowElement();
      const padding = own.radius ? parseFloat(radius[own.radius]) : 0;
      return element && { element, padding };
    },

    middleware: () => own.tether?.middleware ?? [],
  });

  // Read back from the root's slot rather than from the call above,
  // which publishes there and returns nothing. Everything under the
  // root sees the same placement this way, the window included.
  const published = useTetherState();

  const side = () => published()?.side() ?? requestedSide();
  const align = () => published()?.align() ?? requestedAlign();
  const measurement = () => published()?.measurement();

  const arrowData = () => measurement()?.middlewareData.arrow;
  const axis = (): FloatingAxis => AXIS_BY_SIDE[side()];

  // The one place the arrow's size gets its default: the vars and the
  // drawing both read it from here.
  const arrowSize = () =>
    own.arrow && {
      base: own.arrow.base ?? 12,
      depth: own.arrow.depth ?? 6,
    };

  const className = () =>
    clx(css.window, own.radius && css.radiusVariants[own.radius], own.class);

  // Continuous pixel inputs ride in as inline vars; the static rules fold
  // them into the placement math. The measured coordinates join them once
  // a measurement lands. The consumer's styles go under all of it: the
  // placement vars are the window's to set.
  const inlineStyle = () => ({ ...own.style, ...inlineVars() });

  const inlineVars = () => {
    const subject = measurement();
    const arrow = arrowData();
    const size = arrowSize();

    return assignInlineVars({
      ...(own.sideOffset !== undefined && {
        [css.sideOffset]: `${own.sideOffset}px`,
      }),
      ...(own.alignOffset !== undefined && {
        [css.alignOffset]: `${own.alignOffset}px`,
      }),
      ...(subject && {
        [css.tetherX]: `${roundByDevicePixel(subject.x)}px`,
        [css.tetherY]: `${roundByDevicePixel(subject.y)}px`,
      }),

      // The arrow's size, set here rather than on the arrow so the whole
      // window can read it.
      ...(size && {
        [arrowBase]: `${size.base}px`,
        [arrowDepth]: `${size.depth}px`,
      }),

      // Only in point mode.
      ...(own.point && {
        [css.pointX]: `${own.point.x}px`,
        [css.pointY]: `${own.point.y}px`,
      }),

      // The arrow middleware reports the one axis that runs along the
      // anchor edge; the other stays at the stylesheet's zero.
      ...(arrow?.x !== undefined && {
        [arrowX]: `${arrow.x}px`,
      }),
      ...(arrow?.y !== undefined && {
        [arrowY]: `${arrow.y}px`,
      }),
    });
  };

  return (
    <div
      {...box}
      ref={setSubject}
      class={className()}
      style={inlineStyle()}
      data-testid={own.testId}
      data-side={side()}
      data-axis={axis()}
      data-align={align()}
      data-point={own.point ? '' : undefined}
      data-tethered={measurement() ? '' : undefined}
    >
      <Show when={arrowSize()}>
        {(size) => (
          <Arrow
            ref={setArrowElement}
            testId={`${own.testId}-arrow`}
            base={size().base}
            depth={size().depth}
            direction={ARROW_DIRECTION_BY_SIDE[side()]}
            axis={axis()}
            align={align()}
            class={own.arrow?.class}

            // Nonzero when the anchor's span can't hold the arrow's base
            // — slid clear, or narrower than the arrow — so there's
            // nothing to point at.
            hidden={(arrowData()?.centerOffset ?? 0) !== 0}
          />
        )}
      </Show>
      {own.children}
    </div>
  );
};
