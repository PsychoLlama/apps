# Popover

Non-modal panel floated beside its trigger while open. Renders inline, not in a portal.

## Props

Base: `<div>` attributes on the surface (except `role`, `style`, `children`, `content`), test ID props.

- `open` (required): Whether the popover is showing. Fully controlled — there is no `defaultOpen`.
- `onOpenChange` (required): Fires when the trigger toggles. Also fires with `false` on Escape, a press outside, or focus leaving.
- `display` (required): Markup for the wrapper and popover. `'inline'` (`<span>`s, valid in a paragraph) | `'block'` (`<div>`).
- `content` (required): The panel. Name it with `aria-label` or `aria-labelledby`.
- `children` (required): `(trigger) => JSX.Element`. Spread `trigger` onto one button.
- `side` (=`'bottom'`): `'top' | 'right' | 'bottom' | 'left'`.
- `align` (=`'start'`): `'start' | 'center' | 'end'`.
- `sideOffset` (=`8`): Gap from the trigger, in px.
- `alignOffset` (=`0`): Nudge along the edge, in px.
- `size` (=`2`): Surface padding and rounding. `1 | 2 | 3 | 4`.
- `maxWidth` (=`'480px'`): Any CSS width the surface wraps at.
- `class`: Class merged onto the surface.
