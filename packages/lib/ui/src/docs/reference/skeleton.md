# Skeleton

Pulsing placeholder that mirrors the size of its children while their data is loading.

## Props

Base: `<span>` attributes, margin props.

- `loading` (=`true`): Render the placeholder. When `false`, renders children unchanged.

Sizing: pass `style={{ width, height }}` for standalone (childless) skeletons. Otherwise the wrapped children determine the placeholder size.
