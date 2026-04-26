# Tabs

Switch between panels under a row of triggers. Compound API: `Tabs.Root`, `Tabs.List`, `Tabs.Trigger`, `Tabs.Content`. Also exported as flat `TabsRoot` / `TabsList` / `TabsTrigger` / `TabsContent`.

Fully controlled — `value` and `onValueChange` are required on `Root`. Inactive panels are unmounted (`<Show>`); the active panel always carries `tabIndex={0}`.

## Tabs.Root

Owns context. Renders a `<div>`.

Base: margin props.

- `value` (required): Active tab value.
- `onValueChange` (required): Called when the user activates a different tab. `(value: string) => void`.
- `orientation` (=`'horizontal'`): Affects keyboard nav and visual layout. `'horizontal' | 'vertical'`.
- `activationMode` (=`'automatic'`): `'automatic'` activates on focus; `'manual'` requires Space or Enter.
- `loop` (=`true`): Wrap focus around the ends with arrow keys.

## Tabs.List

Trigger row. Renders `<div role="tablist">` with `aria-orientation` set from `Root`.

- `size` (=`2`): `1 | 2`.
- `color` (=`'accent'`): Active indicator color. `'accent' | 'neutral'`.
- `highContrast` (=`false`): Use the strongest color step for the indicator.
- `justify` (=`'start'`): Trigger alignment. `'start' | 'center' | 'end'`.
- `wrap` (=`'nowrap'`): Flex-wrap behavior. `'nowrap' | 'wrap' | 'wrap-reverse'`.

## Tabs.Trigger

A single tab control. Renders `<button role="tab">`. Not polymorphic.

- `value` (required): Identifier matched against `Root`'s `value`.
- `disabled`: Disable the trigger. Skipped during keyboard navigation.

## Tabs.Content

Tab panel. Renders `<div role="tabpanel">`. Not polymorphic — wrap your own semantic element inside if needed.

Base: `<div>` attributes.

- `value` (required): Identifier matched against `Root`'s `value`. Only the active panel renders.
