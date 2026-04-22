import { mergeProps, splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
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
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';

export interface ButtonProps
  extends
    MarginProps,
    ButtonStyleProps,
    RequiredTestIdProps,
    JSX.ButtonHTMLAttributes<HTMLButtonElement> {}

/** Interactive button for triggering actions. */
const Button: ParentComponent<ButtonProps> = (rawProps) => {
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
      ...resolveButtonStyleClasses(local.size, local.variant, local.color),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <button class={className()} data-testid={tid.testId} {...rest}>
      {local.children}
    </button>
  );
};

export default Button;
