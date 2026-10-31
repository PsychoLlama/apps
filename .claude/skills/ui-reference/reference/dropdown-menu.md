# DropdownMenu

Non-modal menu of actions floated beside its trigger while open. Renders inline, not in a portal. Choosing an item closes it.

## DropdownMenu

Base: `<div>` attributes on the surface (except `role`, `style`, `children`, `content`, `color`), test ID props.

- `open` (required): Whether the menu is showing. Fully controlled — there is no `defaultOpen`.
- `onOpenChange` (required): Fires when the trigger toggles. Also fires with `false` when an item is chosen, on Escape, a press outside, or focus leaving.
- `display` (required): Markup for the wrapper and menu. `'inline'` (`<span>`s, valid in a paragraph) | `'block'` (`<div>`).
- `content` (required): The menu, built from the parts below. Labelled by the trigger.
- `children` (required): `(trigger) => JSX.Element`. Spread `trigger` onto one button.
- `side` (=`'bottom'`): `'top' | 'right' | 'bottom' | 'left'`.
- `align` (=`'start'`): `'start' | 'center' | 'end'`.
- `sideOffset` (=`4`): Gap from the trigger, in px.
- `alignOffset` (=`0`): Nudge along the edge, in px.
- `size` (=`2`): Item metrics and type. `1 | 2`.
- `variant` (=`'solid'`): Focused item paint. `'solid' | 'soft'`.
- `color` (=`'accent'`): Highlight palette. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`.
- `class`: Class merged onto the surface.

## DropdownMenuItem

Base: `<div>` attributes (except `role`, `children`, `color`, `onSelect`), test ID props (required).

- `children` (required): The label.
- `onSelect`: `(event: Event) => void`. Call `event.preventDefault()` to keep the menu open.
- `disabled` (=`false`): Skipped for focus, selection, and typeahead.
- `shortcut`: Shortcut text shown at the end. Display only.
- `color`: Item text and highlight palette. Defaults to the menu's.
- `textValue`: Typeahead text. Defaults to the text content.
- `class`: Class merged onto the item.

## DropdownMenuCheckboxItem

Same as `DropdownMenuItem`, plus:

- `checked` (required): `boolean | 'indeterminate'`.
- `onCheckedChange` (required): `(checked: boolean) => void`. Indeterminate turns on.

## DropdownMenuRadioGroup

Base: `<div>` attributes, test ID props.

- `value` (required): Value of the chosen item.
- `onValueChange` (required): `(value: string) => void`.
- `children` (required): `DropdownMenuRadioItem`s.

## DropdownMenuRadioItem

Same as `DropdownMenuItem` without `shortcut`, plus:

- `value` (required): Value the group takes when chosen.

## DropdownMenuGroup

Base: `<div>` attributes, test ID props. `role="group"`; name it with `aria-labelledby` or `aria-label`.

## DropdownMenuLabel

Base: `<div>` attributes, test ID props. Non-focusable heading over a run of items.

## DropdownMenuSeparator

Base: `<div>` attributes, test ID props. Rule between groups of items.

## DropdownMenuTriggerIcon

Base: `<svg>` attributes. Chevron for the trigger. `aria-hidden` by default.
