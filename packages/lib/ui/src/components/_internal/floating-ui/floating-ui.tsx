import { splitProps, type JSX } from 'solid-js';
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
 * Placement along an axis, relative to the pinned edge. Mirrors CSS
 * grid: `justify` runs the inline (horizontal) axis, `align` the block
 * (vertical) axis.
 */
export type FloatingAlignment = 'start' | 'center' | 'end';

/** Props for the floating primitive entry point. */
export interface FloatingContainerProps {
  /** Edge of the anchor the surface binds to. Defaults to `'bottom'`. */
  side?: FloatingSide;
  /** Horizontal placement relative to the pin. Defaults to `'center'`. */
  justify?: FloatingAlignment;
  /** Vertical placement relative to the pin. Defaults to `'start'`. */
  align?: FloatingAlignment;
  /** Floating content to render. */
  children: JSX.Element;
}

/**
 * Entry point for a floating primitive. Owns the positioning shell —
 * pinning to a side of the anchor and sliding along both axes — and
 * wraps the {@link FloatingBody} surface. Further plumbing (layering)
 * will land here as the primitive grows.
 */
export const FloatingContainer = (props: FloatingContainerProps) => {
  return (
    <div
      class={css.container}
      data-side={props.side ?? 'bottom'}
      data-justify={props.justify ?? 'center'}
      data-align={props.align ?? 'start'}
    >
      <FloatingBody>{props.children}</FloatingBody>
    </div>
  );
};
