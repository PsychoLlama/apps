# IconButton

Square button intended to host a single icon. Provide an accessible label via `aria-label`.

## Props

Base: native attributes of the element selected by `as`, margin props.

- `as` (=`'button'`): HTML tag to render. `'button' | 'summary'`. Use `'summary'` inside a `<details>` to reuse the button's visuals for a disclosure toggle.
- `type` (=`'button'` when `as` is `'button'`): HTML button type. Override with `'submit'` to use as a form submitter.
- `size` (=`2`): Visual size. `1 | 2 | 3 | 4`.
- `variant` (=`'solid'`): Visual treatment. `'solid' | 'soft' | 'outline' | 'ghost'`.
- `color` (=`'accent'`): Semantic color. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`.
