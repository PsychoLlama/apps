# ScrollArea

Styled overflow container with custom scrollbars. The viewport hides native scrollbars and renders draggable scrollbars on top of the content. Constrain the area's size from the parent (height, max-height, flex layout) — the component itself stretches to fill.

## Props

Base: native `<div>` attributes (except `dir`), margin props.

- `testId`: Test identifier rendered as `data-testid` on the root.
- `type` (=`'hover'`): Scrollbar visibility behavior. `'auto' | 'always' | 'hover' | 'scroll'`.
- `scrollHideDelay` (=`600`): Hide delay in milliseconds. Used by `'hover'` and `'scroll'`.
- `size` (=`1`): Visual size. `1 | 2 | 3`.
- `radius` (=`'full'`): Corner rounding for the scrollbar track. `'none' | 'small' | 'medium' | 'large' | 'full'`.
- `scrollbars` (=`'both'`): Which axes can scroll. `'vertical' | 'horizontal' | 'both'`.
