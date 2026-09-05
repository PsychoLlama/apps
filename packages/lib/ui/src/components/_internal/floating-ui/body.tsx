import { splitProps, type JSX } from 'solid-js';
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
import * as css from './body.css';

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
