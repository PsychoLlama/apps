# Tabs

Switch between panels under a row of triggers. Composed from four flat components: `TabsRoot`, `TabsList`, `TabsTrigger`, `TabsContent`.

Fully controlled — `value` and `onValueChange` are required on `TabsRoot`. Inactive panels stay mounted with `hidden` (so trigger `aria-controls` always resolves), but their children only render while active. The active panel always carries `tabIndex={0}`.

## TabsRoot

Owns context. Renders a `<div>`.

Base: margin props, `<div>` attributes.

- `value` (required): Active tab value.
- `onValueChange` (required): Called when the user activates a different tab. `(value: string) => void`.
- `activationMode` (=`'automatic'`): `'automatic'` activates on focus; `'manual'` requires Space or Enter.

## TabsList

Trigger row. Renders `<div role="tablist">`.

Base: `<div>` attributes.

- `size` (=`2`): `1 | 2`.
- `color` (=`'accent'`): Active indicator color. `'accent' | 'neutral'`.
- `highContrast` (=`false`): Use the strongest color step for the indicator.
- `justify` (=`'start'`): Trigger alignment. `'start' | 'center' | 'end'`.
- `wrap` (=`'nowrap'`): Flex-wrap behavior. `'nowrap' | 'wrap' | 'wrap-reverse'`.
- `loop` (=`true`): Wrap focus around the ends with arrow keys.

## TabsTrigger

A single tab control. Renders `<button role="tab">`. Not polymorphic.

Base: `<button>` attributes.

- `value` (required): Identifier matched against `TabsRoot`'s `value`.
- `disabled`: Disable the trigger. Skipped during keyboard navigation.

## TabsContent

Tab panel. Renders `<div role="tabpanel">`. Not polymorphic — wrap your own semantic element inside if needed.

Base: `<div>` attributes.

- `value` (required): Identifier matched against `TabsRoot`'s `value`. The panel mounts always; its children only render while active.
