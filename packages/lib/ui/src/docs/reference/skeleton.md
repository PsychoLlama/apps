# Skeleton

Pulsing placeholder that mirrors the size of its children while their data is loading.

## Props

Base: target element attributes, margin props.

- `as`: Element tag. `'span' | HtmlBoxTag`. Pick `'span'` for inline placeholders and a block tag (`'div'`, `'li'`, etc.) when wrapping block-level children.
- `loading` (=`true`): Render the placeholder. When `false`, renders children inside the wrapper without the pulse.

Sizing: pass `style={{ width, height }}` for standalone (childless) skeletons. Otherwise the wrapped children determine the placeholder size.
