/**
 * Table component.
 *
 * Ported from Radix UI Themes Table. Renders an HTML `<table>` composed
 * from seven flat exports — `TableRoot`, `TableHeader`, `TableBody`,
 * `TableRow`, `TableCell`, `TableColumnHeaderCell`, `TableRowHeaderCell`.
 *
 * Deviations from Radix:
 * - `size`, `variant`, `layout`, row `align`, and cell `justify` are
 *   static props — no responsive object form.
 * - Subcomponents are tag-locked (no `as` / `asChild`); each owns its
 *   semantic element (`<table>`, `<thead>`, `<tbody>`, `<tr>`,
 *   `<td>`, `<th>`).
 * - Drops the per-cell `width` and `padding` props. Use `class` or
 *   `style` if a cell needs to override the size's defaults; the
 *   var-driven cell system would otherwise compete with the user's
 *   class on equal specificity.
 * - The root replaces upstream's ScrollArea wrapper with a plain
 *   horizontally-scrolling `<div>`. Keeps the wrapper out of the JS
 *   bundle until we own a ScrollArea component.
 * - No `highContrast` styling. Recorded as a deferred deviation.
 *
 * @see https://www.radix-ui.com/themes/docs/components/table
 */

import { mergeProps, splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
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
import { testIdPropKeys, type TestIdProps } from '../../props/test-id';
import * as css from './table.css';

/** Visual size step. Controls cell padding, min-height, and font size. */
export type TableSize = 1 | 2 | 3;

/** Visual treatment of the wrapper. */
export type TableVariant = 'surface' | 'ghost';

/** `table-layout` mode. */
export type TableLayout = 'auto' | 'fixed';

/** Cross-axis vertical alignment of cells in a row. */
export type TableRowAlign = 'start' | 'center' | 'end' | 'baseline';

/** Horizontal alignment of cell contents. */
export type TableCellJustify = 'start' | 'center' | 'end';

export interface TableRootProps
  extends
    MarginProps,
    SkeletonProps,
    TestIdProps,
    Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Visual size. @default 2 */
  size?: TableSize;
  /** Visual treatment. @default 'ghost' */
  variant?: TableVariant;
  /** Table layout algorithm. */
  layout?: TableLayout;
  /** Table content (`<thead>` / `<tbody>` sections). */
  children?: JSX.Element;
}

/** Scroll wrapper around a `<table>`. Owns size and variant. */
export const TableRoot: ParentComponent<TableRootProps> = (rawProps) => {
  const props = mergeProps(
    { size: 2 as const, variant: 'ghost' as const },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'size',
    'variant',
    'layout',
    'class',
    'children',
    ...skeletonPropKeys,
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.root,
      css.size[local.size],
      css.variant[local.variant],
      skeletonClass(),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  const tableClassName = () =>
    [css.table, local.layout && css.layout[local.layout]]
      .filter(Boolean)
      .join(' ');

  return (
    <div class={className()} data-testid={tid.testId} {...skeletonProps}>
      <table class={tableClassName()}>{local.children}</table>
    </div>
  );
};

export interface TableHeaderProps
  extends TestIdProps, JSX.HTMLAttributes<HTMLTableSectionElement> {}

/** `<thead>` section. Holds column header rows. */
export const TableHeader: ParentComponent<TableHeaderProps> = (rawProps) => {
  const [tid, withoutTid] = splitProps(rawProps, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, ['class', 'children']);

  const className = () => [css.header, local.class].filter(Boolean).join(' ');

  return (
    <thead {...rest} class={className()} data-testid={tid.testId}>
      {local.children}
    </thead>
  );
};

export interface TableBodyProps
  extends TestIdProps, JSX.HTMLAttributes<HTMLTableSectionElement> {}

/** `<tbody>` section. Holds data rows. */
export const TableBody: ParentComponent<TableBodyProps> = (rawProps) => {
  const [tid, withoutTid] = splitProps(rawProps, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, ['class', 'children']);

  const className = () => [css.body, local.class].filter(Boolean).join(' ');

  return (
    <tbody {...rest} class={className()} data-testid={tid.testId}>
      {local.children}
    </tbody>
  );
};

export interface TableRowProps
  extends TestIdProps, JSX.HTMLAttributes<HTMLTableRowElement> {
  /** Vertical alignment of cells in this row. Inherits from the section. */
  align?: TableRowAlign;
}

/** `<tr>` row. Optionally aligns its cells along the cross axis. */
export const TableRow: ParentComponent<TableRowProps> = (rawProps) => {
  const [tid, withoutTid] = splitProps(rawProps, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, ['align', 'class', 'children']);

  const className = () =>
    [css.row, local.align && css.align[local.align], local.class]
      .filter(Boolean)
      .join(' ');

  return (
    <tr {...rest} class={className()} data-testid={tid.testId}>
      {local.children}
    </tr>
  );
};

export interface TableCellProps
  extends
    TestIdProps,
    Omit<JSX.TdHTMLAttributes<HTMLTableCellElement>, 'width'> {
  /** Horizontal alignment of the cell's contents. */
  justify?: TableCellJustify;
}

/** `<td>` data cell. */
export const TableCell: ParentComponent<TableCellProps> = (rawProps) => {
  const [tid, withoutTid] = splitProps(rawProps, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'justify',
    'class',
    'children',
  ]);

  const className = () =>
    [css.cell, local.justify && css.justify[local.justify], local.class]
      .filter(Boolean)
      .join(' ');

  return (
    <td {...rest} class={className()} data-testid={tid.testId}>
      {local.children}
    </td>
  );
};

export interface TableColumnHeaderCellProps
  extends
    TestIdProps,
    Omit<JSX.ThHTMLAttributes<HTMLTableCellElement>, 'width' | 'scope'> {
  /** Horizontal alignment of the cell's contents. */
  justify?: TableCellJustify;
}

/** `<th scope="col">` cell. Labels a column. */
export const TableColumnHeaderCell: ParentComponent<
  TableColumnHeaderCellProps
> = (rawProps) => {
  const [tid, withoutTid] = splitProps(rawProps, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'justify',
    'class',
    'children',
  ]);

  const className = () =>
    [
      css.cell,
      css.columnHeaderCell,
      local.justify && css.justify[local.justify],
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <th {...rest} class={className()} data-testid={tid.testId} scope="col">
      {local.children}
    </th>
  );
};

export interface TableRowHeaderCellProps
  extends
    TestIdProps,
    Omit<JSX.ThHTMLAttributes<HTMLTableCellElement>, 'width' | 'scope'> {
  /** Horizontal alignment of the cell's contents. */
  justify?: TableCellJustify;
}

/** `<th scope="row">` cell. Labels a row. */
export const TableRowHeaderCell: ParentComponent<TableRowHeaderCellProps> = (
  rawProps,
) => {
  const [tid, withoutTid] = splitProps(rawProps, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'justify',
    'class',
    'children',
  ]);

  const className = () =>
    [
      css.cell,
      css.rowHeaderCell,
      local.justify && css.justify[local.justify],
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <th {...rest} class={className()} data-testid={tid.testId} scope="row">
      {local.children}
    </th>
  );
};
