import { Show, splitProps, type JSX } from 'solid-js';
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
import * as css from './floating-ui.css';

export { anchor } from './floating-ui.css';

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

/** Props for the floating primitive's pointer arrow. */
export interface ArrowProps {
  /** Triangle width, in px. Defaults to `12`. */
  width?: number;
  /** Triangle height, in px. Defaults to `6`. */
  height?: number;
  /** Class merged onto the arrow — e.g. a fill or shadow. */
  class?: string;
}

/**
 * Decorative triangle that ties a floating surface back to its anchor.
 * Sized by {@link ArrowProps.width} and {@link ArrowProps.height}; fills
 * with `currentColor` unless a {@link ArrowProps.class} overrides it.
 */
export const Arrow = (props: ArrowProps) => {
  const width = () => props.width ?? 12;
  const height = () => props.height ?? 6;

  return (
    <svg
      width={width()}
      height={height()}
      viewBox={`0 0 ${width()} ${height()}`}
      class={props.class}
      aria-hidden="true"
    >
      <polygon
        points={`0,${height()} ${width()},${height()} ${width() / 2},0`}
        fill="currentColor"
      />
    </svg>
  );
};

/** Which edge of the anchor a floating surface binds to. */
export type FloatingSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * Placement of the surface along the anchor edge it binds to. `start`
 * hugs the top (left/right sides) or left (top/bottom sides); `end` the
 * opposite; `center` splits the difference.
 */
export type FloatingAlignment = 'start' | 'center' | 'end';

/** Arrow configuration for a floating primitive. */
export interface FloatingArrowProps extends ArrowProps {
  /** Whether to render the arrow. Defaults to `false`. */
  visible?: boolean;
}

/** Props for the floating primitive entry point. */
export interface FloatingContainerProps {
  /** Edge of the anchor the surface binds to. Defaults to `'bottom'`. */
  side?: FloatingSide;
  /** Placement along that edge. Defaults to `'center'`. */
  align?: FloatingAlignment;
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
  return (
    <div
      class={css.container}
      data-side={props.side ?? 'bottom'}
      data-align={props.align ?? 'center'}
    >
      <Show when={props.arrow?.visible}>
        <Arrow
          width={props.arrow?.width}
          height={props.arrow?.height}
          class={props.arrow?.class}
        />
      </Show>
      <FloatingBody>{props.children}</FloatingBody>
    </div>
  );
};
