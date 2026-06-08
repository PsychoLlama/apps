# Link

Inline navigation link for in-app routing. Accent and neutral colors only.

## Props

Base: `<a>` attributes, margin props, trim props, truncate props, wrap props, skeleton props, testId props.

- `href`: Destination URL.
- `size`: Visual size on a 1–9 scale. Inherits from the parent when omitted.
- `weight`: Font weight.
- `underline` (=`'auto'`): Underline behavior. `'auto' | 'always' | 'hover' | 'none'`. `'auto'` underlines `neutral` and high-contrast links always, others on hover.
- `color` (=`'accent'`): Semantic color. `'accent' | 'neutral'`.
- `highContrast` (=`false`): Use high-contrast text for stronger emphasis.
- `native`: Render a plain `<a>`, skipping in-app routing. Inferred from `href` when omitted — `mailto:`, `tel:`, `sms:`, and `blob:` default to native.
