# ContextMenu

Non-modal menu of actions for an area, opened at the pointer by a right click or long press. Renders inline, not in a portal. Choosing an item closes it.

## ContextMenu

Base: `<div>` attributes on the surface (except `role`, `style`, `children`, `content`, `color`), test ID props.

- `open` (required): Whether the menu is showing. Fully controlled — there is no `defaultOpen`.
- `onOpenChange` (required): Fires with `true` on a right click or long press in the area. Fires with `false` when an item is chosen, on Escape, a press outside the menu (including elsewhere in the area), or focus leaving.
- `display` (required): Markup for the area wrapper and menu. `'inline'` (`<span>`s, valid in a paragraph) | `'block'` (`<div>`).
- `content` (required): The menu, built from the parts below.
- `children` (required): The area that opens the menu.
- `disabled` (=`false`): Leaves the area to the browser's native menu.
- `size` (=`2`): Item metrics and type. `1 | 2`.
- `variant` (=`'solid'`): Focused item paint. `'solid' | 'soft'`.
- `color` (=`'accent'`): Highlight palette. `'accent' | 'neutral'`.
- `class`: Class merged onto the surface.

## ContextMenuItem

Base: `<div>` attributes (except `role`, `children`, `color`, `onSelect`), test ID props (required).

- `children` (required): The label.
- `onSelect`: `(event: Event) => void`. Call `event.preventDefault()` to keep the menu open.
- `disabled` (=`false`): Skipped for focus, selection, and typeahead.
- `shortcut`: Shortcut text shown at the end. Display only.
- `color`: Item text and highlight palette, e.g. `'danger'` for a destructive action. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`. Defaults to the menu's.
- `textValue`: Typeahead text. Defaults to the text content.
- `class`: Class merged onto the item.

## ContextMenuCheckboxItem

Same as `ContextMenuItem`, plus:

- `checked` (required): `boolean | 'indeterminate'`.
- `onCheckedChange` (required): `(checked: boolean) => void`. Indeterminate turns on.

## ContextMenuRadioGroup

Base: `<div>` attributes, test ID props.

- `value` (required): Value of the chosen item.
- `onValueChange` (required): `(value: string) => void`.
- `children` (required): `ContextMenuRadioItem`s.

## ContextMenuRadioItem

Same as `ContextMenuItem` without `shortcut`, plus:

- `value` (required): Value the group takes when chosen.

## ContextMenuGroup

Base: `<div>` attributes, test ID props. `role="group"`; name it with `aria-labelledby` or `aria-label`.

## ContextMenuLabel

Base: `<div>` attributes, test ID props. Non-focusable heading over a run of items.

## ContextMenuSeparator

Base: `<div>` attributes, test ID props. Rule between groups of items.
