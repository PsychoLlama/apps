# AlertDialog

Modal dialog that interrupts with a decision. A `Dialog` with `role="alertdialog"`, a required description, no click-outside dismissal, and opening focus on the cancelling button.

## Props

Base: `<div>` attributes on the panel (except `title`, `style`, `role`).

- `testId` (required): Test identifier on the panel. The buttons derive theirs — `{testId}-cancel` and `{testId}-action`.
- `open` (required): Whether the dialog is showing. Fully controlled.
- `onOpenChange` (required): Fires when the user asks to close — Escape, Cancel, or right after a confirm. Only ever called with `false`; declining it keeps the dialog up (e.g. while a confirm is in flight).
- `title` (required): Heading at the top of the panel. Also the accessible name.
- `description` (required): What the choice costs. Wired to `aria-describedby`.
- `action` (required): Label for the confirming button.
- `onAction` (required): Fires when the user confirms, just before the close request. Do the work here; leave closing to `onOpenChange`.
- `cancel` (=`'Cancel'`): Label for the button that backs out.
- `color` (=`'accent'`): Semantic color for the confirming button. `'accent' | 'neutral' | 'danger' | 'warning' | 'success'`.
- `size` (=`3`): Panel padding and rounding. `1 | 2 | 3 | 4`.
- `align` (=`'center'`): Where the panel sits when shorter than the viewport. `'start' | 'center'`.
- `maxWidth` (=`'450px'`): Any CSS width for the panel.
- `class`: Class applied to the panel (the visible surface), not the overlay.
- `children`: Extra content between the description and the buttons. Does not take opening focus.
