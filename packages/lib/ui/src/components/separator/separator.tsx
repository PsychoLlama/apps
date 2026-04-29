/**
 * Separator component.
 *
 * Ported from Radix UI Themes Separator. Deviations:
 * - Renders an `<hr>` so the implicit `role="separator"` and the
 *   `aria-orientation` default come from the platform.
 * - `size` and `orientation` are static — no responsive object props.
 * - `decorative` is required, not defaulted, so accessibility intent is
 *   declared at the call site.
 * - No `asChild`; Separator owns its tag.
 *
 * @see https://www.radix-ui.com/themes/docs/components/separator
 */

import { mergeProps, splitProps } from 'solid-js';
import type { Component, JSX } from 'solid-js';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import { testIdPropKeys, type TestIdProps } from '../../props/test-id';
import * as css from './separator.css';

type Orientation = 'horizontal' | 'vertical';
type Size = 1 | 2 | 3 | 4;
type Color = 'accent' | 'neutral' | 'danger' | 'warning' | 'success';

export interface SeparatorProps
  extends
    MarginProps,
    TestIdProps,
    Omit<
      JSX.HTMLAttributes<HTMLHRElement>,
      'role' | 'aria-orientation' | 'children'
    > {
  /** Axis along which the separator is drawn. @default 'horizontal' */
  orientation?: Orientation;
  /** Length along the major axis. `4` stretches to fill. @default 1 */
  size?: Size;
  /** Semantic color drawn at alpha step 6. @default 'neutral' */
  color?: Color;
  /**
   * Marks the separator as decorative. Decorative separators are removed
   * from the accessibility tree.
   */
  decorative: boolean;
}

/** Visual divider between sibling content. */
const Separator: Component<SeparatorProps> = (rawProps) => {
  const props = mergeProps(
    {
      orientation: 'horizontal' as const,
      size: 1 as const,
      color: 'neutral' as const,
    },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'orientation',
    'size',
    'color',
    'decorative',
    'class',
  ]);

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.base,
      css.orientation[local.orientation],
      css.size[local.orientation][local.size],
      css.color[local.color],
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <hr
      class={className()}
      data-testid={tid.testId}
      role={local.decorative ? 'none' : undefined}
      aria-orientation={
        !local.decorative && local.orientation === 'vertical'
          ? 'vertical'
          : undefined
      }
      {...rest}
    />
  );
};

export default Separator;
