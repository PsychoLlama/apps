# Switch

Two-state toggle. Renders a `<button role="switch">` with a sliding thumb.

## Props

Base: `<button>` attributes (except `type`, `role`, `size`, `color`, `value`, `children`), margin props.

- `testId` (required): Test identifier rendered as `data-testid` on the button.
- `size` (=`2`): Visual size. `1 | 2 | 3`.
- `variant` (=`'surface'`): Visual treatment. `'classic' | 'surface' | 'soft'`.
- `radius` (=`'full'`): Corner rounding. `'none' | 'small' | 'medium' | 'large' | 'full'`.
- `checked`: Controlled checked state. Pair with `onCheckedChange`.
- `defaultChecked` (=`false`): Initial checked state when uncontrolled.
- `onCheckedChange`: Fires after the user toggles the switch with the next state.
- `value` (=`'on'`): Form-submit value when checked. Field is omitted from `FormData` when unchecked.
