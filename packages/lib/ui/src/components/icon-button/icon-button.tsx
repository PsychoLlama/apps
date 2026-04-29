/**
 * IconButton component. A square button intended to host a single icon
 * (no label).
 *
 * Ported from Radix UI Themes IconButton. Deviations:
 * - No `radius` prop. Corner radius tracks `size` like our other
 *   components rather than cascading from a theme-level data attribute.
 * - No `loading`, `highContrast`, or 26-accent `color` prop.
 * - No `asChild` / `as`. The component owns the `<button>` tag —
 *   wrapping an icon in `<details><summary>…</summary></details>` for a
 *   disclosure toggle is a job for `Button as="summary"`, not
 *   IconButton.
 * - Ghost variant keeps the square footprint instead of expanding via
 *   padding + negative-margin compensation. Our margin system is
 *   class-based, not CSS-variable-based, so the Radix trick doesn't fit
 *   cleanly. Hit target equals visual size at every variant.
 * - `type` defaults to `"button"` so an IconButton inside a `<form>`
 *   doesn't silently submit. Override with `type="submit"` to opt in.
 *
 * @see https://www.radix-ui.com/themes/docs/components/icon-button
 */

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
  resolveIconButtonStyleClasses,
  type ButtonStyleProps,
} from '../../props/button';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';

export interface IconButtonProps
  extends
    ButtonStyleProps,
    MarginProps,
    RequiredTestIdProps,
    JSX.ButtonHTMLAttributes<HTMLButtonElement> {}

/** Square button sized to host a single icon. */
const IconButton: ParentComponent<IconButtonProps> = (rawProps) => {
  const props = mergeProps(
    { type: 'button' as const },
    buttonStyleDefaults,
    rawProps,
  );
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
      ...resolveIconButtonStyleClasses(local.size, local.variant, local.color),
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

export default IconButton;
