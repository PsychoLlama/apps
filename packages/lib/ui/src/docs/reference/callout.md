# Callout

Informational container with an optional icon. Content is not wrapped — consumers control their own text layout.

## Props

Base: `<div>` attributes, margin props.

- `size` (=`2`): Visual size. `1 | 2 | 3`.
- `variant` (=`'soft'`): Visual treatment. `'soft' | 'surface' | 'outline'`.
- `color` (=`'accent'`): Semantic color. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`.
- `highContrast` (=`false`): High-contrast text for stronger emphasis.
- `icon` (=info icon): Icon element displayed before text. `JSX.Element`.
