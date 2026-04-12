# Grid

Polymorphic (`as` required).

## Props

Base: all [Box](./box.md) props.

- `columns`: Equal-width columns. `1 | 2 | 3 | 4 | 5 | 6`.
- `rows`: Equal-height rows. `1 | 2 | 3 | 4 | 5 | 6`.
- `align`: Vertical alignment of items. `'start' | 'center' | 'end' | 'stretch'`.
- `justify`: Horizontal alignment of items. `'start' | 'center' | 'end' | 'stretch'`.
- `gap`: Uniform row and column spacing. `SpaceScale`.
- `gapX`: Column spacing. Overrides `gap` on the inline axis. `SpaceScale`.
- `gapY`: Row spacing. Overrides `gap` on the block axis. `SpaceScale`.
