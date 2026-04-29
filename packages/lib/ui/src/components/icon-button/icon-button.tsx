/**
 * IconButton component. A compact, square button intended to host a
 * single icon (no label).
 *
 * Ported from Radix UI Themes IconButton. Deviations:
 * - No `radius` prop. The corner radius tracks size like our other
 *   components rather than cascading from a theme-level data attribute.
 * - No `loading`, `highContrast`, or `color` accent variants.
 * - `as` is restricted to `'button' | 'summary'` (mirroring Button) so
 *   the same visuals can drive a `<details>` toggle.
 *
 * @see https://www.radix-ui.com/themes/docs/components/icon-button
 */

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
  type ButtonColor,
  type ButtonSize,
  type ButtonStyleProps,
  type ButtonVariant,
} from '../../props/button';
import { base, variantColor } from '../../props/button.css';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import * as css from './icon-button.css';

const resolveIconButtonStyleClasses = (
  size: ButtonSize,
  variant: ButtonVariant,
  color: ButtonColor,
): string[] => {
  return [base, css.size[size], variantColor[variant][color]];
};

interface IconButtonOwnProps
  extends ButtonStyleProps, MarginProps, RequiredTestIdProps {}

/**
 * IconButton props. `as` defaults to `'button'`; set it to `'summary'`
 * when using the button inside a `<details>` disclosure so the native
 * toggle semantics survive.
 */
export type IconButtonProps =
  | ({ as?: 'button' } & IconButtonOwnProps &
      JSX.ButtonHTMLAttributes<HTMLButtonElement>)
  | ({ as: 'summary' } & IconButtonOwnProps & JSX.HTMLAttributes<HTMLElement>);

/** Square button sized to host a single icon. */
const IconButton: ParentComponent<IconButtonProps> = (rawProps) => {
  const props = mergeProps(
    { as: 'button' as const },
    buttonStyleDefaults,
    rawProps,
  );
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
      ...resolveIconButtonStyleClasses(local.size, local.variant, local.color),
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
};

export default IconButton;
