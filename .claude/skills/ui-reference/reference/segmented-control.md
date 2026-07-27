# SegmentedControl

Row of mutually exclusive options sharing one track, with a chip that slides to the selection. Composed from two flat exports: `SegmentedControlRoot` (the track) and `SegmentedControlItem` (one segment per option). Each item is a `<label>` wrapping a visually-hidden `<input type="radio">`, so arrow-key navigation, focus, and form submission work without a roving-focus group.

The chip is positioned entirely in CSS (`:has()` probes keyed to `:nth-of-type`), which caps a track at 10 segments — past that the chip stops rendering. Item children are rendered twice per segment to cross-fade between checked and unchecked weights, so keep them cheap and side-effect free.

## SegmentedControlRoot Props

Base: `<div>` attributes (except `onChange`, `role`), margin props, skeleton props.

- `testId` (required): Test identifier rendered as `data-testid` on the root.
- `value` (required): Currently selected value, or `null` for no selection (hides the chip).
- `onValueChange` (required): Fires when the user selects a different segment.
- `name` (required): Form-submit name applied to every item. Also groups the inputs for native arrow-key navigation.
- `size` (=`2`): Visual size. `1 | 2 | 3`.
- `variant` (=`'surface'`): Visual treatment of the indicator chip. `'surface' | 'classic'`.
- `radius`: Track rounding. `'none' | 'small' | 'medium' | 'large' | 'full'`. Omit to inherit the rounding implied by `size`.
- `disabled` (=`false`): Disable every segment in the group.
- `required` (=`false`): Mark the group as required for assistive technology and HTML5 form validation.

## SegmentedControlItem Props

Base: `<input>` attributes (except `type`, `size`, `color`, `name`, `value`, `checked`, `defaultChecked`, `required`, `class`, `style`, `children`).

- `testId` (required): Test identifier rendered as `data-testid` on the hidden input.
- `value` (required): Value submitted when this segment is selected, matched against the group's `value`.
- `disabled`: Disable just this segment. Combines with the group's `disabled`.
- `required`: Override the group's `required` for this segment. Omit to inherit; pass `false` to opt this segment out of HTML5 form validation while leaving the rest of the group required.
- `class`: Class applied to the wrapping `<label>` (the visible segment).
- `style`: Inline style applied to the wrapping `<label>`.
- `children`: Segment content rendered inside the wrapping `<label>`.
