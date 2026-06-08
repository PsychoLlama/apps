/**
 * Button-styled anchor built on {@link https://docs.solidjs.com/solid-router/reference/components/a | \<A\>}
 * from `@solidjs/router`. Renders a native `<a>` for the schemes the router
 * would otherwise mangle into in-app paths; inferred from `href` by default,
 * or override with `native`. See {@link LinkButtonProps.native}.
 */

import { A, type AnchorProps } from '@solidjs/router';
import { mergeProps, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
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
  type NativeProps,
  nativePropKeys,
  resolveNative,
} from '../../props/native';
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
    NativeProps,
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
    ...nativePropKeys,
    'class',
    'children',
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  const native = () => resolveNative(local.native, props.href);

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
    <Dynamic
      component={native() ? 'a' : A}
      class={className()}
      data-testid={tid.testId}
      {...skeletonProps}
    >
      {local.children}
    </Dynamic>
  );
};

export default LinkButton;
