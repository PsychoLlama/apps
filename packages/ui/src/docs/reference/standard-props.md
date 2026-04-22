# Standard Props

Shared prop groups used across components. Values use `space` tokens from `#design`.

`SpaceScale`: `1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9`.

## Margin Props

- `m`: Margin on all sides.
- `mx`: Horizontal margin.
- `my`: Vertical margin.

## Padding Props

- `p`: Padding on all sides.
- `px`: Horizontal padding.
- `py`: Vertical padding.

## Trim Props

Remove extra whitespace caused by line-height.

- `trim`: Side to trim. `'start' | 'end' | 'both'`.

## Selectable Props

Override the global `user-select: none` default.

- `selectable`: Allow text selection. `boolean`.

## Test ID Props

Attach a test identifier to the underlying DOM node.

- `testId`: Renders as `data-testid`. `string`.
