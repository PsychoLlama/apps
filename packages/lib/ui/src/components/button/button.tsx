import { mergeProps, splitProps } from 'solid-js';
import type { JSX } from 'solid-js';
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
import { type PolymorphicProps } from '../../props/polymorphic';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';

/**
 * Tags Button may render as. `'summary'` exists so a `<details>` disclosure
 * can reuse the button's visual language while keeping the native toggle
 * semantics.
 */
export type ButtonTag = 'button' | 'summary';

interface ButtonOwnProps
  extends ButtonStyleProps, MarginProps, RequiredTestIdProps {}

/** Button props for a specific element tag. */
export type ButtonProps<T extends ButtonTag> = PolymorphicProps<
  T,
  ButtonOwnProps
>;

/** Interactive button for triggering actions. */
function Button<const T extends ButtonTag>(props: ButtonProps<T>): JSX.Element;
function Button(
  rawProps: { as: ButtonTag } & ButtonOwnProps &
    JSX.HTMLAttributes<HTMLElement>,
) {
  const props = mergeProps(buttonStyleDefaults, rawProps);
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    ...buttonStylePropKeys,
    'as',
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
    <Dynamic
      component={local.as}
      class={className()}
      data-testid={tid.testId}
      {...rest}
    >
      {local.children}
    </Dynamic>
  );
}

export default Button;
