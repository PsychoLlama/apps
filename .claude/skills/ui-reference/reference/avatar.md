# Avatar

User image with initials/icon fallback. Shows the image once it loads; falls back to `fallback` while loading or after an error. Renders a `<span role="img">`.

## Props

Base: `<span>` attributes (except `children`), margin props, skeleton props.

- `alt` (required): Accessible name. Stays the accessible label across image/fallback swaps.
- `fallback` (required): Content shown while loading or after an error. Initials, icon, or any inline node.
- `src`: Image URL. When absent, the fallback renders immediately.
- `delayMs`: Wait this many ms before mounting the fallback. Suppresses a flash on fast loads.
- `size` (=`2`): Visual size. `1 | 2 | 3`.
- `variant` (=`'soft'`): Fallback surface treatment. `'solid' | 'soft'`.
- `color` (=`'accent'`): Fallback color palette. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`.
- `radius` (=`'full'`): Corner rounding. `'none' | 'small' | 'medium' | 'large' | 'full'`.
- `referrerPolicy`: Forwarded to the inner `<img>`.
- `crossOrigin`: Forwarded to the inner `<img>`.
