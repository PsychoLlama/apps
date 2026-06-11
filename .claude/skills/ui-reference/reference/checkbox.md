# Checkbox

Tri-state checkbox. Renders a styled native `<input type="checkbox">`, optionally wrapped in a `<label>` when inline children are supplied. Controlled-only — the parent owns `checked` and `onCheckedChange`.

## Props

Base: `<input>` attributes (except `type`, `size`, `color`, `checked`, `defaultChecked`, `value`, `children`, `onChange`), margin props, skeleton props.

- `testId` (required): Test identifier rendered as `data-testid` on the input.
- `checked` (required): Controlled checked state. `boolean | 'indeterminate'`.
- `onCheckedChange` (required): Fires after the user toggles the checkbox with the next state. `'indeterminate'` is never emitted.
- `size` (=`2`): Visual size. `1 | 2 | 3`.
- `variant` (=`'surface'`): Visual treatment. `'classic' | 'surface' | 'soft'`.
- `color` (=`'accent'`): Semantic palette for the checked indicator. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`.
- `name`: Form-submit name. The browser includes the field in `FormData` only when checked.
- `value` (=`'on'`): Form-submit value when checked.
- `required` (=`false`): Marks the input as required for assistive technology.
- `selectable` (=`false`): Allow the reader to select the label text.
- `children`: Inline label rendered to the right of the checkbox.
