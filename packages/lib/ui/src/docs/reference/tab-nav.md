# TabNav

Horizontal navigation strip of routing links styled to match `TabsList`. Composed from two flat components: `TabNavRoot` and `TabNavLink`.

Renders semantic `<nav><ul><li><a>`. Each link is wrapped in its own `<li>`. The active link receives `aria-current="page"`. The active state is explicit — consumers compute it from their router (e.g. `useMatch(href)`).

## TabNavRoot

Renders `<nav>` with an inner `<ul role="list">`.

Base: margin props.

- `aria-label` (required): Accessible name for the nav landmark.
- `size` (=`2`): `1 | 2`.
- `color` (=`'accent'`): Active indicator color. `'accent' | 'neutral'`.
- `highContrast` (=`false`): Use the strongest color step for the indicator.
- `justify` (=`'start'`): Link alignment. `'start' | 'center' | 'end'`.
- `wrap` (=`'nowrap'`): Flex-wrap behavior. `'nowrap' | 'wrap' | 'wrap-reverse'`.

## TabNavLink

Wraps `<A>` from `@solidjs/router` inside an `<li>`.

Base: `AnchorProps` from `@solidjs/router`.

- `href` (required): Inherited from `AnchorProps`.
- `active` (=`false`): Mark as the current page. Sets `aria-current="page"` and the visual indicator.
