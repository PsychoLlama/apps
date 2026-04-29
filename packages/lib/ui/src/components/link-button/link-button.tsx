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
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';

export interface LinkButtonProps
  extends MarginProps, ButtonStyleProps, RequiredTestIdProps, AnchorProps {}

/** Anchor element styled as a button for navigation actions. */
const LinkButton: ParentComponent<LinkButtonProps> = (rawProps) => {
  const props = mergeProps(buttonStyleDefaults, rawProps);
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    ...buttonStylePropKeys,
    'class',
    'children',
  ]);

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      ...resolveButtonStyleClasses(
        local.size,
        local.variant,
        local.color,
        local.radius,
      ),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <A class={className()} data-testid={tid.testId} {...rest}>
      {local.children}
    </A>
  );
};

export default LinkButton;
