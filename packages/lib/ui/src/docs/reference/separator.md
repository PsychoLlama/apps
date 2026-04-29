# Separator

Visual divider between sibling content.

## Props

Base: `<hr>` attributes (excluding `role`, `aria-orientation`, and `children`), margin props.

- `orientation` (=`'horizontal'`): Axis along which the separator is drawn. `'horizontal' | 'vertical'`.
- `size` (=`1`): Length along the major axis. `1 | 2 | 3 | 4`. `4` stretches to fill.
- `color` (=`'neutral'`): Semantic color drawn at alpha step 6. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`.
- `decorative` (required): Mark as decorative. Decorative separators are removed from the accessibility tree.
