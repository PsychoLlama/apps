# Progress

Linear progress bar. Renders a `<div role="progressbar">` with an inner indicator. Pass `value` for a determinate bar; omit or pass `null` for an indeterminate animation.

## Props

Base: `<div>` attributes (except `role`, `aria-valuemin`/`max`/`now`/`text`, `children`), margin props, skeleton props.

- `testId`: Test identifier rendered as `data-testid`.
- `value` (=`null`): Current value between `0` and `max`. `null` triggers the indeterminate animation. `number | null`.
- `max` (=`100`): Maximum value.
- `getValueLabel` (=`v => Math.round(v / max * 100) + '%'`): Format the `aria-valuetext` announcement. `(value: number, max: number) => string`.
- `size` (=`2`): Visual size. `1 | 2 | 3`.
- `variant` (=`'surface'`): Visual treatment. `'classic' | 'surface' | 'soft'`.
- `radius` (=`'full'`): Corner rounding. `'none' | 'small' | 'medium' | 'large' | 'full'`.
- `color` (=`'accent'`): Semantic palette for the indicator. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`.
- `duration` (=`'5s'`): Length of the indeterminate "grow" phase before the bar settles into a pulse. Ignored when `value` is a number. `${number}s | ${number}ms`.
