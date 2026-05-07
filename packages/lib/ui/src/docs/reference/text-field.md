# TextField

Single-line text input with optional inline content on either side.

## Props

Base: `<input>` attributes (except `size`, `color`), margin props, skeleton props, required input hint props.

- `testId` (required): Test identifier rendered as `data-testid` on the wrapping element.
- `size` (=`2`): Visual size. `1 | 2 | 3`.
- `variant` (=`'surface'`): Visual treatment. `'classic' | 'surface' | 'soft'`.
- `radius` (=`'medium'`): Corner rounding. `'none' | 'small' | 'medium' | 'large' | 'full'`.
- `type` (=`'text'`): `<input>` type — narrowed to `'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'datetime-local' | 'month' | 'time' | 'week'`. Button-like and non-text types are excluded.
- `left`: Content rendered before the input — typically an icon or prefix.
- `right`: Content rendered after the input — typically an icon or action button.
