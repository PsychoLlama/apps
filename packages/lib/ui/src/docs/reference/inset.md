# Inset

Bleeds content past a parent `Card`'s padding to the card's edges. Reads CSS variables assigned by `Card`, so the cutout tracks the active card size automatically.

## Props

Base: native attributes of the element selected by `as`, margin props.

- `as` (required): HTML tag to render (typically `'div'`, `'img'`, or `'video'`).
- `side` (=`'all'`): Which sides to break out of. `'all' | 'x' | 'y' | 'top' | 'bottom' | 'left' | 'right'`. `'top'` / `'bottom'` also extend horizontally so media fills edge-to-edge.
- `clip` (=`'border-box'`): Overflow clipping region. `'border-box'` rounds corners with the card; `'padding-box'` keeps the inset square.
- `pad` (=`true`): Reserve the card's padding on the sides that aren't bled, so following content keeps its rhythm. Set false for media that should flow flush into the next element.
