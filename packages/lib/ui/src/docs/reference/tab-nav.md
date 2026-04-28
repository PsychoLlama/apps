# TabNav

Horizontal navigation strip of routing links. Composed from two flat components: `TabNavRoot` and `TabNavLink`.

The active link receives `aria-current="page"`. Compute `active` from your router (e.g. `useMatch(href)`). Arrow keys and Home/End move focus between links.

## TabNavRoot

Renders `<nav>` containing a `<ul>` of links.

Base: margin props, `<nav>` attributes.

- `aria-label` (required): Accessible name for the nav landmark.
- `size` (=`2`): `1 | 2`.
- `color` (=`'accent'`): Active indicator color. `'accent' | 'neutral'`.
- `highContrast` (=`false`): Use the strongest color step for the indicator.
- `justify` (=`'start'`): Link alignment. `'start' | 'center' | 'end'`.
- `wrap` (=`'nowrap'`): Flex-wrap behavior. `'nowrap' | 'wrap' | 'wrap-reverse'`.

## TabNavLink

Renders `<a>` inside an `<li>`. Routes through `@solidjs/router`.

Base: `<a>` attributes.

- `href` (required): Destination URL.
- `active` (required): Whether this link represents the current page. Sets `aria-current="page"` and the visual indicator when `true`.
