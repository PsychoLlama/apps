# IconButton

Square button intended to host a single icon. Requires an accessible name via either `aria-label` (literal text) or `aria-labelledby` (id of an existing labeling element).

## Props

Base: `<button>` attributes, margin props, skeleton props.

- `aria-label` / `aria-labelledby`: One of the two is required. An icon-only control has no name for assistive technology without it.
- `type` (=`'button'`): HTML button type. Override with `'submit'` to use as a form submitter.
- `size` (=`2`): Visual size. `1 | 2 | 3 | 4`.
- `variant` (=`'solid'`): Visual treatment. `'solid' | 'soft' | 'surface' | 'outline' | 'ghost'`.
- `color` (=`'accent'`): Semantic color. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`.
- `radius`: Corner radius override. `'none' | 'small' | 'medium' | 'large' | 'full'`. Defaults to a size-based radius.
