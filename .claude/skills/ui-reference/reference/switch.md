# Switch

Two-state toggle. Renders a `<button role="switch">` with a sliding thumb. Controlled-only — the parent owns `checked` and `onCheckedChange`.

## Props

Base: `<button>` attributes (except `type`, `role`, `size`, `color`, `value`, `children`), margin props, skeleton props.

- `testId` (required): Test identifier rendered as `data-testid` on the button.
- `checked` (required): Controlled checked state.
- `onCheckedChange` (required): Fires after the user toggles the switch with the next state.
- `size` (=`2`): Visual size. `1 | 2 | 3`.
- `variant` (=`'surface'`): Visual treatment. `'classic' | 'surface' | 'soft'`.
- `radius` (=`'full'`): Corner rounding. `'none' | 'small' | 'medium' | 'large' | 'full'`.
- `color` (=`'accent'`): Semantic palette for the checked track. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`.
- `value` (=`'on'`): Form-submit value when checked. Field is omitted from `FormData` when unchecked or disabled.
