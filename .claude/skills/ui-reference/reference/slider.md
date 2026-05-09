# Slider

Range input. Pass a single value for a regular slider, multiple for a range. Each value renders a `<span role="slider">` thumb. Controlled-only — the parent owns `value` and `onValueChange`.

## Props

Base: native `<span>` attributes (except `color`, `children`), margin props, skeleton props.

- `testId` (required): Test identifier rendered as `data-testid` on the root.
- `value` (required): Controlled value(s). Length determines the thumb count.
- `onValueChange` (required): Fires every time the value changes (drag, keyboard, click).
- `onValueCommit`: Fires once after a slide gesture or keystroke commits.
- `size` (=`2`): Visual size. `1 | 2 | 3`.
- `variant` (=`'surface'`): Visual treatment. `'classic' | 'surface' | 'soft'`.
- `radius` (=`'full'`): Corner rounding. `'none' | 'small' | 'medium' | 'large' | 'full'`.
- `color` (=`'accent'`): Semantic palette for the filled range. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`.
- `orientation` (=`'horizontal'`): Layout axis. `'horizontal' | 'vertical'`.
- `inverted` (=`false`): Reverse the slide axis.
- `disabled` (=`false`): Disables interaction and focus.
- `min` (=`0`): Lower bound.
- `max` (=`100`): Upper bound.
- `step` (=`1`): Smallest value increment.
- `minStepsBetweenThumbs` (=`0`): Minimum number of `step`s required between any two thumbs.
- `name`: Form field name. Renders one hidden input per thumb when set; multi-thumb sliders append `[]`.
- `form`: Associates hidden inputs with a form by id.
