# Standard Props

Shared prop groups used across components. Values use `space` tokens from `@lib/design`.

`SpaceScale`: `1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9`.

## Margin Props

- `m`: Margin on all sides.
- `mx`: Horizontal margin.
- `my`: Vertical margin.

## Padding Props

- `p`: Padding on all sides.
- `px`: Horizontal padding.
- `py`: Vertical padding.
- `pt`: Top padding.
- `pr`: Right padding.
- `pb`: Bottom padding.
- `pl`: Left padding.

## Trim Props

Remove extra whitespace caused by line-height.

- `trim`: Side to trim. `'start' | 'end' | 'both'`.

## Selectable Props

Override the global `user-select: none` default.

- `selectable`: Allow text selection. `boolean`.

## Skeleton Props

Render the component as a pulsing placeholder while data loads. The component swaps in a skeleton overlay; consumer-supplied class, style, margin, and `data-testid` stay attached so toggling the prop doesn't drop layout or test hooks.

- `skeleton`: Render as a pulsing placeholder. `boolean`.

## Test ID Props

Attach a test identifier to the underlying DOM node.

- `testId`: Renders as `data-testid`. `string`.
