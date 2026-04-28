# TextArea

Multi-line text input. The wrapper owns the resize handle so dragging reshapes the entire visual surface, including padding.

## Props

Base: `<textarea>` attributes (except `color`), margin props.

- `testId` (required): Test identifier rendered as `data-testid` on the wrapping element.
- `size` (=`2`): Visual size. `1 | 2 | 3`.
- `variant` (=`'surface'`): Visual treatment. `'classic' | 'surface' | 'soft'`.
- `radius` (=`'medium'`): Corner rounding. `'none' | 'small' | 'medium' | 'large' | 'full'`.
- `resize` (=`'none'`): Resize handle behavior. `'none' | 'vertical' | 'horizontal' | 'both'`.
