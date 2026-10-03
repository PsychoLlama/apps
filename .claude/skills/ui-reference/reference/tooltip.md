# Tooltip

Short label floated beside its trigger on hover (after 200ms) or keyboard focus. One shows at a time. Renders inline, not in a portal.

## Props

Base: `<div>` attributes on the surface (except `role`, `style`, `children`).

- `testId` (required): Test identifier rendered as `data-testid` on the window.
- `display` (required): Wrapper around the trigger. `'inline'` (`<span>`) | `'block'` (`<div>`).
- `content` (required): The label. Short, plain, not interactive.
- `children` (required): `(trigger) => JSX.Element`. Spread `trigger` onto one focusable element.
- `aria-label`: Read in place of `content`.
- `side` (=`'top'`): `'top' | 'right' | 'bottom' | 'left'`.
- `align` (=`'center'`): `'start' | 'center' | 'end'`.
- `sideOffset` (=`4`): Gap from the trigger, in px.
- `alignOffset` (=`0`): Nudge along the edge, in px.
- `maxWidth` (=`'360px'`): Any CSS width the surface wraps at.
- `hoverable` (=`true`): Whether the pointer can rest on the tooltip. `false` lets it pass through.
- `class`: Class merged onto the surface.
