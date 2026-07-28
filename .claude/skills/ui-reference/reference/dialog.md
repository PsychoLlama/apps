# Dialog

Modal window overlaid on the page, blocking it until dismissed. Built on a native `<dialog>` in the top layer, so the platform owns the focus trap, Escape, and focus restoration.

## Props

Base: `<div>` attributes on the panel (except `title`, `style`).

- `testId` (required): Test identifier rendered as `data-testid` on the panel.
- `open` (required): Whether the dialog is showing. Fully controlled — there is no `defaultOpen`.
- `onOpenChange` (required): Fires when the user asks to close (Escape, or a click outside the panel). Only ever called with `false`.
- `title` (required): Heading at the top of the panel. Also the dialog's accessible name.
- `description`: Supporting copy under the title. Wired to `aria-describedby`.
- `size` (=`3`): Panel padding and rounding. `1 | 2 | 3 | 4`.
- `align` (=`'center'`): Where the panel sits when shorter than the viewport. `'start' | 'center'`.
- `dismissible` (=`true`): Let Escape and outside clicks close the dialog. Turn off for flows that must end in an explicit choice.
- `maxWidth` (=`'600px'`): Any CSS width for the panel.
- `class`: Class applied to the panel (the visible surface), not the overlay.
- `children`: Body content, rendered under the title and description. Unmounts after a close, so form state does not survive one.
