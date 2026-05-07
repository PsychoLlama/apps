# ScrollArea

Constrains content to a fixed footprint with native, CSS-styled scrollbars.

## Props

Base: native attributes of the element selected by `as`, margin props, test id props.

- `as` (required): HTML tag to render (typically `'div'`, but any layout/structural tag works).
- `type` (=`'auto'`): When the scrollbar is rendered. `'auto' | 'always' | 'hover'`. `'auto'` shows the scrollbar only when content overflows; `'always'` reserves it permanently; `'hover'` keeps the scrollbar transparent until the viewport is hovered or focused.
- `size` (=`1`): Visual size on a 1–2 scale. `1` maps to `scrollbar-width: thin`; `2` to platform-default `auto`. CSS Scrollbars Module Level 1 only defines two visible widths; modern Chromium ignores `::-webkit-scrollbar { width }` once `scrollbar-color` is set.
- `scrollbars` (=`'both'`): Which axes can scroll. `'vertical' | 'horizontal' | 'both'`.
