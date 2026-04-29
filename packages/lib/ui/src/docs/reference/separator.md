# Separator

Visual divider between sibling content.

## Props

Base: `<hr>` attributes (excluding `role` and `aria-orientation`), margin props.

- `orientation` (=`'horizontal'`): Axis along which the separator is drawn. `'horizontal' | 'vertical'`.
- `size` (=`1`): Length along the major axis. `1 | 2 | 3 | 4`. `4` stretches to fill.
- `color` (=`'neutral'`): Semantic color drawn at alpha step 6. `'accent' | 'neutral'`.
- `decorative` (=`true`): Mark as decorative. Decorative separators are removed from the accessibility tree.
