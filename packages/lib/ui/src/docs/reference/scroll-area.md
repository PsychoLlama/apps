# ScrollArea

Styled overflow container with custom scrollbars. The viewport hides native scrollbars and renders draggable scrollbars on top of the content. Constrain the area's size from the parent (height, max-height, flex layout) — the component itself stretches to fill.

Tag-locked. Wrap in a semantic element (`<article>`, `<aside>`, `<section>`) when the scroll region needs role meaning. `aria-*`, `role`, `tabIndex`, and `id` forward to the viewport so consumers can label the scrollable region directly.

## Props

Base: native `<div>` attributes (except `dir`), margin props. Wrapper-only props (`class`, `style`, margin, `testId`) attach to the root; everything else forwards to the viewport.

- `testId`: Test identifier rendered as `data-testid` on the root.
- `type` (=`'hover'`): Scrollbar visibility behavior. `'auto' | 'always' | 'hover' | 'scroll'`.
- `scrollHideDelay`: Hide delay in milliseconds. Used by `'hover'` and `'scroll'`. Defaults to `600` for `type='scroll'`, `0` otherwise.
- `size` (=`1`): Visual size. `1 | 2 | 3`.
- `radius` (=`'full'`): Corner rounding for the scrollbar track. `'none' | 'small' | 'medium' | 'large' | 'full'`.
- `scrollbars` (=`'both'`): Which axes can scroll. `'vertical' | 'horizontal' | 'both'`.
