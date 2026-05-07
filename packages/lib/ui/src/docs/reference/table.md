# Table

HTML `<table>` for tabular data. Composed from seven flat exports: `TableRoot`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, `TableColumnHeaderCell`, `TableRowHeaderCell`.

## TableRoot

Renders a horizontally-scrolling `<div>` containing a `<table>`. Owns size, variant, and layout.

Base: `<div>` attributes, margin props, skeleton props, test ID props.

- `size` (=`2`): Visual size. Controls cell padding, min-height, and font size. `1 | 2 | 3`.
- `variant` (=`'ghost'`): Visual treatment. `'surface' | 'ghost'`.
- `layout`: `table-layout` algorithm. `'auto' | 'fixed'`.

## TableHeader

Renders a `<thead>`. Holds column header rows.

Base: `<thead>` attributes, test ID props.

## TableBody

Renders a `<tbody>`. Holds data rows.

Base: `<tbody>` attributes, test ID props.

## TableRow

Renders a `<tr>`. Optionally aligns its cells along the cross axis.

Base: `<tr>` attributes, test ID props.

- `align`: Vertical alignment of cells in this row. `'start' | 'center' | 'end' | 'baseline'`.

## TableCell

Renders a `<td>`.

Base: `<td>` attributes (excluding `width`), test ID props.

- `justify`: Horizontal alignment of the cell's contents. `'start' | 'center' | 'end'`.

## TableColumnHeaderCell

Renders a `<th scope="col">`. Labels a column.

Base: `<th>` attributes (excluding `width` and `scope`), test ID props.

- `justify`: Horizontal alignment of the cell's contents. `'start' | 'center' | 'end'`.

## TableRowHeaderCell

Renders a `<th scope="row">`. Labels a row.

Base: `<th>` attributes (excluding `width` and `scope`), test ID props.

- `justify`: Horizontal alignment of the cell's contents. `'start' | 'center' | 'end'`.
