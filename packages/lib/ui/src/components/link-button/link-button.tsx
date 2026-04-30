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
import {
  type SkeletonProps,
  skeletonPropKeys,
  useSkeleton,
} from '../../props/skeleton';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';

export interface LinkButtonProps
  extends
    MarginProps,
    ButtonStyleProps,
    SkeletonProps,
    RequiredTestIdProps,
    AnchorProps {}

/** Anchor element styled as a button for navigation actions. */
const LinkButton: ParentComponent<LinkButtonProps> = (rawProps) => {
  const props = mergeProps(buttonStyleDefaults, rawProps);
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    ...buttonStylePropKeys,
    ...skeletonPropKeys,
    'class',
    'children',
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      ...resolveButtonStyleClasses(
        local.size,
        local.variant,
        local.color,
        local.radius,
      ),
      skeletonClass(),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <A class={className()} data-testid={tid.testId} {...skeletonProps}>
      {local.children}
    </A>
  );
};

export default LinkButton;
