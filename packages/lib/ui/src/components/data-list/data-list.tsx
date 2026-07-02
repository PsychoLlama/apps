/**
 * DataList component.
 *
 * Ported from Radix UI Themes Data List. Renders a description list
 * (`<dl>`/`<div>`/`<dt>`/`<dd>`) composed from four flat exports —
 * `DataListRoot`, `DataListItem`, `DataListLabel`, `DataListValue`.
 *
 * Deviations from Radix:
 * - `size`, `orientation`, and `align` are static — no responsive object
 *   props.
 * - Label `color` accepts every semantic palette (no hand-picked subset);
 *   omit to inherit the low-contrast neutral default.
 * - No `width` / `minWidth` / `maxWidth` props on the label; subgrid sizes
 *   the column from content. Style the label directly if you need a track
 *   width.
 * - Drops the value-bleed margin trick; rows align cleanly at the baseline.
 * - Leading-trim is provided through the standard `trim` prop (the same
 *   baseline polyfill `Text` and `Heading` use). No bespoke `--data-list`
 *   trim variables.
 * - Subcomponents are tag-locked (no `as` / `asChild`). Each subcomponent
 *   owns its semantic element.
 * - The label does not emit `data-accent-color`. Tint the label via the
 *   `color` prop; consumers can't drive label color from a parent attribute
 *   selector.
 * - No `highContrast` styling. Recorded as a deferred deviation.
 *
 * @see https://www.radix-ui.com/themes/docs/components/data-list
 */

import { mergeProps, splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import {
  resolveTrimClass,
  trimPropKeys,
  type TrimProps,
} from '../../props/trim';
import {
  type SkeletonProps,
  skeletonPropKeys,
  useSkeleton,
} from '../../props/skeleton';
import { testIdPropKeys, type TestIdProps } from '../../props/test-id';
import * as css from './data-list.css';

/** Semantic color palette accepted by `DataListLabel`. */
export type DataListColor =
  'accent' | 'neutral' | 'danger' | 'warning' | 'success';

/** Visual size step. Controls the gap between items. */
export type DataListSize = 1 | 2 | 3;

/** Layout axis. */
export type DataListOrientation = 'horizontal' | 'vertical';

/** Cross-axis alignment used inside a horizontal row. */
export type DataListAlign = 'start' | 'center' | 'end' | 'baseline' | 'stretch';

export interface DataListRootProps
  extends
    MarginProps,
    SkeletonProps,
    TrimProps,
    TestIdProps,
    JSX.HTMLAttributes<HTMLDListElement> {
  /** Layout axis. @default 'horizontal' */
  orientation?: DataListOrientation;
  /** Visual size. Controls the gap between items. @default 2 */
  size?: DataListSize;
}

/** Description-list container. Owns orientation, size, and gap. */
export const DataListRoot: ParentComponent<DataListRootProps> = (rawProps) => {
  const props = mergeProps(
    { orientation: 'horizontal' as const, size: 2 as const },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'orientation',
    'size',
    'class',
    'children',
    ...trimPropKeys,
    ...skeletonPropKeys,
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.orientation[local.orientation],
      css.size[local.size],
      resolveTrimClass(local),
      skeletonClass(),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <dl class={className()} data-testid={tid.testId} {...skeletonProps}>
      {local.children}
    </dl>
  );
};

export interface DataListItemProps
  extends TestIdProps, JSX.HTMLAttributes<HTMLDivElement> {
  /**
   * Cross-axis alignment of label and value within a row. Only takes
   * effect in horizontal orientation. @default 'baseline'
   */
  align?: DataListAlign;
}

/** Label + value pair. Wraps each row inside a `DataListRoot`. */
export const DataListItem: ParentComponent<DataListItemProps> = (rawProps) => {
  const [tid, withoutTid] = splitProps(rawProps, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, ['align', 'class', 'children']);

  const className = () =>
    [css.item, local.align && css.align[local.align], local.class]
      .filter(Boolean)
      .join(' ');

  return (
    <div {...rest} class={className()} data-testid={tid.testId}>
      {local.children}
    </div>
  );
};

export interface DataListLabelProps
  extends TestIdProps, JSX.HTMLAttributes<HTMLElement> {
  /** Semantic color tint. Defaults to neutral low-contrast. */
  color?: DataListColor;
}

/** Term in a row. Renders a `<dt>`. */
export const DataListLabel: ParentComponent<DataListLabelProps> = (
  rawProps,
) => {
  const [tid, withoutTid] = splitProps(rawProps, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, ['color', 'class', 'children']);

  const className = () =>
    [css.label, local.color && css.labelColor[local.color], local.class]
      .filter(Boolean)
      .join(' ');

  return (
    <dt {...rest} class={className()} data-testid={tid.testId}>
      {local.children}
    </dt>
  );
};

export interface DataListValueProps
  extends TestIdProps, JSX.HTMLAttributes<HTMLElement> {}

/** Description in a row. Renders a `<dd>`. */
export const DataListValue: ParentComponent<DataListValueProps> = (
  rawProps,
) => {
  const [tid, withoutTid] = splitProps(rawProps, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, ['class', 'children']);

  const className = () => [css.value, local.class].filter(Boolean).join(' ');

  return (
    <dd {...rest} class={className()} data-testid={tid.testId}>
      {local.children}
    </dd>
  );
};
