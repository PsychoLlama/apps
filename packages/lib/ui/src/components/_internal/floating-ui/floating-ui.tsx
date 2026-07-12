import { Show, splitProps, type JSX } from 'solid-js';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { type RadiusScale } from '@lib/design';
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
import * as css from './floating-ui.css';

export { anchor } from './floating-ui.css';
export {
  Arrow,
  type ArrowAlign,
  type ArrowDirection,
  type ArrowProps,
} from './arrow';

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
 */

// Deliberately hand-rolled and short-lived. Most (likely all) of this
// exists only because the CSS `anchor-positioning` primitives and the
// `popover` attribute aren't baseline-available yet. Once they are, the
// anchoring/layering plumbing collapses into a few CSS properties and
// this module can be deleted rather than grown.

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

/** Which edge of the anchor a floating surface binds to. */
export type FloatingSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * A coordinate inside the anchor box, in px from its top-left corner.
 * Binds the surface to a point instead of an edge — context menus
 * anchor to the pointer, item-aligned selects to a measured item.
 */
export interface FloatingPoint {
  /** Horizontal distance from the anchor's left edge, in px. */
  x: number;
  /** Vertical distance from the anchor's top edge, in px. */
  y: number;
}

/**
 * Placement of the surface along the anchor edge it binds to. `start`
 * hugs the top (left/right sides) or left (top/bottom sides); `end` the
 * opposite; `center` splits the difference.
 */
export type FloatingAlignment = 'start' | 'center' | 'end';

/**
 * Arrow configuration for a floating primitive. `direction` is omitted —
 * the container derives it from {@link FloatingContainerProps.side}.
 */
export interface FloatingArrowProps extends Omit<ArrowProps, 'direction'> {
  /** Whether to render the arrow. Defaults to `false`. */
  visible?: boolean;
}

/**
 * Direction the arrow points so it faces the anchor, keyed by
 * {@link FloatingSide}. The container's `flex-direction` (driven from CSS
 * by `data-side`) seats the DOM-first arrow on the anchor-facing edge.
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
 * The flex, padding, and test-id groups aren't the shell's own — they
 * pass straight through to the {@link FloatingBody} surface, the node
 * that lays out and pads the content. So does {@link class} and
 * {@link radius}. The shell keeps only what positions the surface:
 * {@link side}, {@link align}, and the {@link arrow}.
 */
export interface FloatingContainerProps
  extends FlexProps, PaddingProps, TestIdProps {
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
   * Border radius of the surface, from the design token scale. Also
   * offsets a start/end-aligned arrow so it clears the rounded corner.
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
    'side',
    'align',
    'arrow',
    'sideOffset',
    'alignOffset',
    'point',
  ]);
  const side = () => shell.side ?? 'bottom';

  const className = () =>
    [css.container, body.radius && css.arrowRadiusOffset[body.radius]]
      .filter(Boolean)
      .join(' ');

  // Continuous pixel inputs ride in as inline vars; the static rules
  // fold them into the placement math.
  const inlineVars = () =>
    assignInlineVars({
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
    });

  return (
    <div
      class={className()}
      style={inlineVars()}
      data-side={side()}
      data-align={shell.align ?? 'center'}
      data-point={shell.point ? '' : undefined}
    >
      <Show when={shell.arrow?.visible}>
        <Arrow
          base={shell.arrow?.base}
          depth={shell.arrow?.depth}
          direction={ARROW_DIRECTION_BY_SIDE[side()]}
          align={shell.arrow?.align}
          class={shell.arrow?.class}
        />
      </Show>
      <FloatingBody {...body} />
    </div>
  );
};
