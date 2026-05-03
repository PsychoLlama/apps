# Radio

Single styled `<input type="radio">`. Suitable as a standalone control or for custom layouts; reach for `RadioGroup` when several options share state.

## Props

Base: `<input>` attributes (except `type`, `size`, `color`, `defaultChecked`, `children`), margin props, skeleton props.

- `testId` (required): Test identifier rendered as `data-testid` on the input.
- `checked` (required): Controlled checked state.
- `onCheckedChange` (required): Fires after the user activates the radio. Always called with `true` — radios cannot be unchecked by the user.
- `size` (=`2`): Visual size. `1 | 2 | 3`.
- `variant` (=`'surface'`): Visual treatment. `'classic' | 'surface' | 'soft'`.
- `color` (=`'accent'`): Semantic palette for the checked indicator. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`.
