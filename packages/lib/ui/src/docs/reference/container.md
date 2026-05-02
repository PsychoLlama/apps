# Container

Polymorphic (`as` required). Caps the inner column at a fixed max-width and aligns it within the available horizontal space. Pair with `Section` for vertical rhythm.

## Props

Base: rendered element attributes, margin props, padding props, skeleton props, `background`, `radius`, `shadow`.

- `as` (required): Flow-content container tag. `'div' | 'main' | 'article' | 'section' | 'aside' | 'header' | 'footer' | 'nav' | 'figure'`. Restricted because the component always wraps children in an inner `<div>`.
- `size` (=`4`): Max-width preset for the inner column. `1 | 2 | 3 | 4`. Maps to 28 / 43 / 55 / 71 rem.
- `align` (=`'center'`): Horizontal alignment of the inner column. `'start' | 'center' | 'end'`.
