# HoverCard

Preview of supplementary content, floated beside its trigger on hover or keyboard focus. Renders inline, not in a portal.

## Props

Base: `<div>` attributes on the surface (except `role`, `style`, `children`, `content`), test ID props.

- `display` (required): Markup for the wrapper and card. `'inline'` (`<span>`s, valid in a paragraph) | `'block'` (`<div>`).
- `content` (required): The card. Supplementary — keep it reachable some other way, usually through the trigger.
- `children` (required): `(trigger) => JSX.Element`. Spread `trigger` onto one focusable element, usually a link.
- `side` (=`'bottom'`): `'top' | 'right' | 'bottom' | 'left'`.
- `align` (=`'start'`): `'start' | 'center' | 'end'`.
- `sideOffset` (=`8`): Gap from the trigger, in px.
- `alignOffset` (=`0`): Nudge along the edge, in px.
- `size` (=`2`): Surface padding and rounding. `1 | 2 | 3`.
- `maxWidth` (=`'480px'`): Any CSS width the surface wraps at.
- `class`: Class merged onto the surface.
