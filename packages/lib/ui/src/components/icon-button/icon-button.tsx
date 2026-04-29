/**
 * IconButton component. A square button intended to host a single icon
 * (no label).
 *
 * Ported from Radix UI Themes IconButton. Deviations:
 * - `radius` is a per-component prop, not a theme-level
 *   `data-radius` cascade.
 * - No `loading`, `highContrast`, or 26-accent `color` prop.
 * - No `asChild` / `as`. The component owns the `<button>` tag —
 *   wrapping an icon in `<details><summary>…</summary></details>` for a
 *   disclosure toggle is a job for `Button as="summary"`, not
 *   IconButton.
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

type IconButtonBase = ButtonStyleProps &
  MarginProps &
  RequiredTestIdProps &
  Omit<
    JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    'aria-label' | 'aria-labelledby'
  >;

/**
 * IconButton props. Either `aria-label` or `aria-labelledby` is required —
 * an icon-only control has no visible text, so it needs an explicit
 * accessible name. Use `aria-label` for a literal string; reach for
 * `aria-labelledby` when the name already lives in another element
 * (a sibling heading, a row label, etc.).
 */
export type IconButtonProps =
  | (IconButtonBase & { 'aria-label': string; 'aria-labelledby'?: never })
  | (IconButtonBase & { 'aria-label'?: never; 'aria-labelledby': string });

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
      ...resolveIconButtonStyleClasses(
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
    <button class={className()} data-testid={tid.testId} {...rest}>
      {local.children}
    </button>
  );
};

export default IconButton;
