# Kbd

Inline keyboard input — typically a single key or chord.

## Props

Base: `<kbd>` attributes, margin props, selectable props, skeleton props.

- `size`: Visual size. `1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9`. Falls back to 0.75× the parent font-size when omitted.
- `variant` (=`'classic'`): Visual treatment. `'classic' | 'soft'`.
- `selectable` (=`false`): Allow the reader to select the key text.
