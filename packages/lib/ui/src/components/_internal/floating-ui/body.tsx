import { mergeProps, splitProps, type JSX } from 'solid-js';
import clx from '@lib/classnames';
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
import { type RequiredTestIdProps } from '../../../props/test-id';
import * as css from './body.css';

/**
 * Props for the floating content surface.
 *
 * Every native attribute and handler passes through to the surface
 * element. The base is semantics-free — it attaches no role or ARIA of
 * its own — but it has to be transparent, because the surface _is_ the
 * node a floating component labels, describes, focuses, and listens on.
 *
 * The corner radius isn't a prop here: the window sets it, and the
 * surface inherits it.
 *
 * A test id is required: the surface is the node a floating component
 * styles and gives semantics to, so its tests need a handle on it.
 */
export interface FloatingBodyProps
  extends
    FlexProps,
    PaddingProps,
    RequiredTestIdProps,
    JSX.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether the surface catches the pointer. A non-interactive surface
   * is see-through to it: presses and hover land on whatever is beneath.
   * @default true
   */
  interactive?: boolean;

  /** Extra class names merged onto the surface element. */
  class?: string;

  /** Floating content to render. */
  children: JSX.Element;
}

/**
 * The visual surface of a floating primitive. Lays out and pads its
 * children; consumers style and test against this node, and it is the
 * node they label, focus, and listen on. Renders as the child of a
 * `FloatingWindow`.
 */
export const FloatingBody = (rawProps: FloatingBodyProps) => {
  const props = mergeProps({ interactive: true }, rawProps);
  const [flex, afterFlex] = splitProps(props, flexPropKeys);
  const [padding, afterPadding] = splitProps(afterFlex, paddingPropKeys);
  const [local, passthrough] = splitProps(afterPadding, [
    'interactive',
    'class',
    'children',
    'testId',
  ]);

  const className = () =>
    clx(
      css.body,
      resolveFlexClasses(flex),
      resolvePaddingClasses(padding),
      local.class,
    );

  return (
    <div
      {...passthrough}
      class={className()}
      data-interactive={String(local.interactive)}
      data-testid={local.testId}
    >
      {local.children}
    </div>
  );
};
