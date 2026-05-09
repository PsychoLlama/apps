# Card

Surface container with consistent padding, border, and elevation. Pair with `Inset` to bleed media past the padding to the card's edges.

## Props

Base: native attributes of the element selected by `as`, margin props, skeleton props.

- `as` (required): HTML tag to render. `'a' | 'label' | HtmlBoxTag`. When `as` is `'a' | 'button' | 'label'`, the card gains hover and focus-visible styling.
- `size` (=`1`): Visual size on a 1–5 scale. Controls padding and border-radius. `1 | 2 | 3 | 4 | 5`.
- `variant` (=`'surface'`): Visual treatment. `'surface' | 'classic' | 'ghost'`.
