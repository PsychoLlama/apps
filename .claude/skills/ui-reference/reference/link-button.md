# LinkButton

Anchor styled as a button, for navigation actions. Reach for it over `Button` when the action navigates.

## Props

Base: `<a>` attributes, margin props, skeleton props, testId props.

- `href`: Destination URL.
- `size` (=`2`): Visual size. `1 | 2 | 3 | 4`.
- `variant` (=`'solid'`): Visual treatment. `'solid' | 'soft' | 'surface' | 'outline' | 'ghost'`.
- `color` (=`'accent'`): Semantic color. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`.
- `radius`: Corner radius override. `'none' | 'small' | 'medium' | 'large' | 'full'`. Defaults to a size-based radius.
