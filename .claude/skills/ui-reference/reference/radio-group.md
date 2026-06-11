# RadioGroup

Group of radios that share a single value. Composed from two flat exports: `RadioGroupRoot` (the container) and `RadioGroupItem` (one radio per option). Native `<input type="radio">` underneath, so arrow-key navigation and form submission work without a roving-focus group.

## RadioGroupRoot Props

Base: `<div>` attributes (except `onChange`, `role`), margin props, skeleton props.

- `testId` (required): Test identifier rendered as `data-testid` on the root.
- `value` (required): Currently selected value, or `null` for no selection.
- `onValueChange` (required): Fires when the user activates a different item.
- `name` (required): Form-submit name applied to every item. Also groups the inputs for native arrow-key navigation.
- `size` (=`2`): Visual size. `1 | 2 | 3`.
- `variant` (=`'surface'`): Visual treatment. `'classic' | 'surface' | 'soft'`.
- `color` (=`'accent'`): Semantic palette for the checked indicator. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`.
- `orientation` (=`'vertical'`): Layout axis. `'vertical' | 'horizontal'`. Surfaces as `aria-orientation` on the radiogroup.
- `disabled` (=`false`): Disable every item in the group.
- `required` (=`false`): Mark the group as required for assistive technology and HTML5 form validation.

## RadioGroupItem Props

Base: `<input>` attributes (except `type`, `size`, `color`, `name`, `value`, `checked`, `defaultChecked`).

- `testId` (required): Test identifier rendered as `data-testid` on the input.
- `value` (required): Value submitted when checked, matched against the group's `value`.
- `disabled`: Disable just this item. Combines with the group's `disabled`.
- `selectable` (=`false`): Allow the reader to select the label text.
- `children`: Inline label. When provided, the input is wrapped in a `<label>` with the children to the right; otherwise the bare input is rendered.
