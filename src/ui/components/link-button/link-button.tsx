/**
 * Button-styled anchor built on {@link https://docs.solidjs.com/solid-router/reference/components/a | \<A\>}
 * from `@solidjs/router`.
 */

import { A, type AnchorProps } from '@solidjs/router';
import { mergeProps, splitProps } from 'solid-js';
import type { ParentComponent } from 'solid-js';
import {
  buttonStyleDefaults,
  buttonStylePropKeys,
  resolveButtonStyleClasses,
  type ButtonStyleProps,
} from '../../props/button';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';

export interface LinkButtonProps
  extends MarginProps, ButtonStyleProps, AnchorProps {}

/** Anchor element styled as a button for navigation actions. */
const LinkButton: ParentComponent<LinkButtonProps> = (rawProps) => {
  const props = mergeProps(buttonStyleDefaults, rawProps);
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [local, rest] = splitProps(withoutMargin, [
    ...buttonStylePropKeys,
    'class',
    'children',
  ]);

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      ...resolveButtonStyleClasses(local.size, local.variant, local.color),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <A class={className()} {...rest}>
      {local.children}
    </A>
  );
};

export default LinkButton;
