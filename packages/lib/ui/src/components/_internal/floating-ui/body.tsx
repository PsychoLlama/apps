import { splitProps, type JSX } from 'solid-js';
import { type RadiusScale } from '@lib/design';
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
import { type TestIdProps } from '../../../props/test-id';
import * as css from './body.css';

/**
 * Props for the floating content surface.
 *
 * Every native attribute and handler passes through to the surface
 * element. The base is semantics-free — it attaches no role or ARIA of
 * its own — but it has to be transparent, because the surface _is_ the
 * node a floating component labels, describes, focuses, and listens on.
 */
export interface FloatingBodyProps
  extends
    FlexProps,
    PaddingProps,
    TestIdProps,
    JSX.HTMLAttributes<HTMLDivElement> {
  /** Border radius of the surface, from the design token scale. */
  radius?: RadiusScale;
  /** Extra class names merged onto the surface element. */
  class?: string;
  /** Floating content to render. */
  children: JSX.Element;
}

/**
 * The visual surface of a floating primitive. Lays out and pads its
 * children; consumers style and test against this node, and it is the
 * node they label, focus, and listen on.
 */
export const FloatingBody = (props: FloatingBodyProps) => {
  const [flex, afterFlex] = splitProps(props, flexPropKeys);
  const [padding, afterPadding] = splitProps(afterFlex, paddingPropKeys);
  const [local, passthrough] = splitProps(afterPadding, [
    'radius',
    'class',
    'children',
    'testId',
  ]);

  const className = () =>
    clx(
      css.body,
      local.radius && css.bodyRadius[local.radius],
      resolveFlexClasses(flex),
      resolvePaddingClasses(padding),
      local.class,
    );

  return (
    <div {...passthrough} class={className()} data-testid={local.testId}>
      {local.children}
    </div>
  );
};
