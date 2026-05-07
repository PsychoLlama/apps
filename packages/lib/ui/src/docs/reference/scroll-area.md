# ScrollArea

Constrains content to a fixed footprint with native, CSS-styled scrollbars.

## Props

Base: `<div>` attributes, margin props, test id props.

- `type` (=`'auto'`): When the scrollbar is rendered. `'auto' | 'always'`. `'auto'` shows the scrollbar only when content overflows; `'always'` reserves it permanently.
- `size` (=`1`): Visual size on a 1–3 scale. Affects WebKit scrollbar width; Firefox is fixed at `scrollbar-width: thin`.
- `scrollbars` (=`'both'`): Which axes can scroll. `'vertical' | 'horizontal' | 'both'`.
