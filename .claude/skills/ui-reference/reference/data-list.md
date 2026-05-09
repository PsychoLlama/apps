# DataList

Description list (`<dl>` / `<dt>` / `<dd>`) for label–value pairs. Composed from four flat exports: `DataListRoot`, `DataListItem`, `DataListLabel`, `DataListValue`.

## DataListRoot

Renders a `<dl>`. Owns orientation, size, and gap.

Base: `<dl>` attributes, margin props, trim props, skeleton props, test ID props.

- `orientation` (=`'horizontal'`): Layout axis. `'horizontal' | 'vertical'`.
- `size` (=`2`): Visual size. Controls the gap between items. `1 | 2 | 3`.

## DataListItem

Renders a `<div>`. Wraps each label–value row.

Base: `<div>` attributes, test ID props.

- `align` (=`'baseline'`): Cross-axis alignment of label and value within the row. Only applies in horizontal orientation. `'start' | 'center' | 'end' | 'baseline' | 'stretch'`.

## DataListLabel

Renders a `<dt>`.

Base: HTML element attributes, test ID props.

- `color`: Semantic color tint. Defaults to neutral low-contrast. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`.

## DataListValue

Renders a `<dd>`.

Base: HTML element attributes, test ID props.
