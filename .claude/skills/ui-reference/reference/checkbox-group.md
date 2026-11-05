# CheckboxGroup

Vertical list of checkbox options bound to one `string[]`. Composed from two flat exports: `CheckboxGroupRoot` (the container) and `CheckboxGroupItem` (one `Checkbox` per option). Use it for a multi-select over a list of values; use a standalone `Checkbox` for independent booleans.

## CheckboxGroupRoot Props

Base: `<div>` attributes (except `onChange`, `role`), margin props, skeleton props.

- `testId` (required): Test identifier rendered as `data-testid` on the root.
- `value` (required): Currently checked values as a `readonly string[]`. Pass `[]` for an empty selection.
- `onValueChange` (required): Fires when the user toggles any item with the next array.
- `name` (required): Form-submit name applied to every item. The browser submits one entry per checked item under this name (`FormData.getAll(name)`).
- `size` (=`2`): Visual size. `1 | 2 | 3`.
- `variant` (=`'surface'`): Visual treatment. `'classic' | 'surface' | 'soft'`.
- `color` (=`'accent'`): Semantic palette for the checked indicator. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`.
- `disabled` (=`false`): Disable every item in the group.
- `required` (=`false`): Mark every item as required for HTML5 form validation. Most useful on single-item groups.

## CheckboxGroupItem Props

Base: `Checkbox` props except `checked`, `onCheckedChange`, `name`, `size`, `variant`, `color` (owned by the group).

- `testId` (required): Test identifier rendered as `data-testid` on the input.
- `value` (required): Value added to the group's `value` array when checked.
- `disabled`: Disable just this item. Combines with the group's `disabled`.
- `required`: Override the group's `required` for this item. Omit to inherit.
- `children`: Inline label rendered to the right of the checkbox. Omit to render a bare checkbox.
