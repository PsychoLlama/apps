import { mergeProps, splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import {
  buttonStyleDefaults,
  buttonStylePropKeys,
  resolveButtonStyleClasses,
  type ButtonStyleProps,
} from '../../props/button';
import {
  type SkeletonProps,
  skeletonPropKeys,
  resolveSkeletonClass,
  resolveSkeletonAttrs,
} from '../../props/skeleton';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';

interface ButtonOwnProps
  extends ButtonStyleProps, MarginProps, SkeletonProps, RequiredTestIdProps {}

/**
 * Button props. `as` defaults to `'button'`; set it to `'summary'` when
 * using the button inside a `<details>` disclosure so the native toggle
 * semantics survive. When rendering a `<button>`, `type` defaults to
 * `'button'` to avoid accidental form submissions; pass `type="submit"`
 * to opt in.
 */
export type ButtonProps =
  | ({ as?: 'button' } & ButtonOwnProps &
      JSX.ButtonHTMLAttributes<HTMLButtonElement>)
  | ({ as: 'summary' } & ButtonOwnProps & JSX.HTMLAttributes<HTMLElement>);

/** Interactive button for triggering actions. */
const Button: ParentComponent<ButtonProps> = (rawProps) => {
  const props = mergeProps(
    { as: 'button' as const },
    buttonStyleDefaults,
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    ...buttonStylePropKeys,
    ...skeletonPropKeys,
    'as',
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
      resolveSkeletonClass(local),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  const merged = mergeProps(rest, () => resolveSkeletonAttrs(local));

  return (
    <Dynamic
      component={local.as}
      type={local.as === 'button' ? 'button' : undefined}
      class={className()}
      data-testid={tid.testId}
      {...merged}
    >
      {local.children}
    </Dynamic>
  );
};

export default Button;
