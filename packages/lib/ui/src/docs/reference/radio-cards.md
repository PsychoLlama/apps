# RadioCards

Group of radio options rendered as selectable cards. Composed from two flat exports: `RadioCardsRoot` (the container) and `RadioCardsItem` (one card per option). Each item is a `<label>` wrapping a visually-hidden `<input type="radio">`, so arrow-key navigation, focus, and form submission work without a roving-focus group.

## RadioCardsRoot Props

Base: `<div>` attributes (except `onChange`, `role`), margin props, skeleton props.

- `testId` (required): Test identifier rendered as `data-testid` on the root.
- `value` (required): Currently selected value, or `null` for no selection.
- `onValueChange` (required): Fires when the user selects a different card.
- `name` (required): Form-submit name applied to every item. Also groups the inputs for native arrow-key navigation.
- `size` (=`2`): Visual size. `1 | 2 | 3`.
- `variant` (=`'surface'`): Visual treatment. `'surface' | 'classic'`.
- `color` (=`'accent'`): Semantic palette for the checked outline and focus ring. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`.
- `columns`: Fixed column count. `1 | 2 | 3 | 4 | 5 | 6`. Omit to use the auto-fit `minmax(160px, 1fr)` default.
- `gap` (=`4`): Spacing between cards. Any `SpaceScale` value.
- `disabled` (=`false`): Disable every card in the group.
- `required` (=`false`): Mark the group as required for assistive technology and HTML5 form validation.

## RadioCardsItem Props

Base: `<input>` attributes (except `type`, `size`, `color`, `name`, `value`, `checked`, `defaultChecked`, `required`, `class`, `style`, `children`).

- `testId` (required): Test identifier rendered as `data-testid` on the hidden input.
- `value` (required): Value submitted when this card is selected, matched against the group's `value`.
- `disabled`: Disable just this card. Combines with the group's `disabled`.
- `class`: Class applied to the wrapping `<label>` (the visible card).
- `style`: Inline style applied to the wrapping `<label>` (the visible card).
- `children`: Card content rendered inside the wrapping `<label>`.
