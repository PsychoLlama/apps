# CheckboxCards

Group of checkbox options rendered as selectable cards. Composed from two flat exports: `CheckboxCardsRoot` (the container) and `CheckboxCardsItem` (one card per option). Each item is a `<label>` wrapping the consumer's content plus a visible `<Checkbox>` pinned to the right; clicking anywhere on the card toggles that value in the group's array.

## CheckboxCardsRoot Props

Base: `<div>` attributes (except `onChange`, `role`), margin props, skeleton props.

- `testId` (required): Test identifier rendered as `data-testid` on the root.
- `value` (required): Currently checked values as a `readonly string[]`. Pass `[]` for an empty selection.
- `onValueChange` (required): Fires when the user toggles any card with the next array.
- `name` (required): Form-submit name applied to every item. The browser submits one entry per checked item under this name (`FormData.getAll(name)`).
- `size` (=`2`): Visual size. `1 | 2 | 3`.
- `variant` (=`'surface'`): Visual treatment. `'surface' | 'classic'`.
- `color` (=`'accent'`): Semantic palette for the card focus outline and the inner checkbox indicator. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`.
- `columns`: Fixed column count. `1 | 2 | 3 | 4 | 5 | 6`. Omit to use the auto-fit `minmax(160px, 1fr)` default.
- `gap` (=`4`): Spacing between cards. Any `SpaceScale` value.
- `disabled` (=`false`): Disable every card in the group.
- `required` (=`false`): Mark every item as required for HTML5 form validation. Most useful on single-item groups (e.g. a standalone "I agree" card).

## CheckboxCardsItem Props

- `testId` (required): Test identifier rendered as `data-testid` on the inner checkbox input.
- `value` (required): Value added to the group's `value` array when the card is checked.
- `disabled`: Disable just this card. Combines with the group's `disabled`.
- `required`: Override the group's `required` for this card. Omit to inherit; pass `false` to opt this card out of HTML5 form validation while leaving the rest required.
- `class`: Class applied to the wrapping `<label>` (the visible card).
- `style`: Inline style applied to the wrapping `<label>` (the visible card).
- `children`: Card content rendered to the left of the inner checkbox.
